import { NextRequest, NextResponse } from 'next/server';

/**
 * LIFFのIDトークンを検証してFirebaseのカスタムトークンを生成するAPI
 * Vercel等の本番環境では環境変数のみを使用（firebase-admin-key.jsonは参照しない）
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { message: 'IDトークンが提供されていません' },
        { status: 400 }
      );
    }

    // LIFFのIDトークンを検証
    const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: process.env.NEXT_PUBLIC_LIFF_ID || '',
      }),
    });

    if (!verifyResponse.ok) {
      return NextResponse.json(
        { message: 'IDトークンの検証に失敗しました' },
        { status: 401 }
      );
    }

    const lineProfile = await verifyResponse.json();

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    
    // 秘密鍵の改行文字を正しく処理
    // .env.localでは実際の改行が含まれる場合と、\nという文字列の場合がある
    // Vercelの環境変数では、\n という文字列として保存されている
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (privateKey) {
      // ダブルクォートを削除（.env.localでダブルクォートで囲まれている場合）
      privateKey = privateKey.trim();
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }
      
      // \\n を実際の改行に変換（Vercel環境変数やエスケープされた場合）
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // もし改行が含まれていない場合（Vercelで改行が失われた場合）、
      // BEGIN PRIVATE KEY と END PRIVATE KEY の間で改行を追加
      if (!privateKey.includes('\n') && privateKey.includes('BEGIN PRIVATE KEY') && privateKey.includes('END PRIVATE KEY')) {
        // BEGIN PRIVATE KEYの後に改行を追加
        privateKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n');
        // END PRIVATE KEYの前に改行を追加
        privateKey = privateKey.replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');
      }
    }

    if (!projectId || !clientEmail || !privateKey) {
      return NextResponse.json(
        {
          message:
            'Firebase Admin SDKの設定が見つかりません。Vercelの環境変数に FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY を設定してください。',
          error: 'Firebase Admin SDK not configured',
        },
        { status: 500 }
      );
    }

    const admin = await import('firebase-admin');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    const customToken = await admin.auth().createCustomToken(lineProfile.sub);
    return NextResponse.json({ customToken });
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      {
        message: '認証処理中にエラーが発生しました',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
