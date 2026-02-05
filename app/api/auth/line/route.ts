import { NextRequest, NextResponse } from 'next/server';

/**
 * LIFFのIDトークンを検証してFirebaseのカスタムトークンを生成するAPI
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

    // Firebase Admin SDKを使用してカスタムトークンを生成
    let admin;
    try {
      // 動的インポート（サーバーサイドでのみ動作）
      admin = await import('firebase-admin');
      
      // Firebase Admin SDKの初期化（まだ初期化されていない場合）
      if (!admin.apps.length) {
        // 環境変数から設定を読み込む
        const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (projectId && clientEmail && privateKey) {
          // 環境変数から初期化
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
        } else {
          // サービスアカウントJSONファイルから初期化を試みる
          try {
            const serviceAccount = await import('@/firebase-admin-key.json');
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount.default as admin.ServiceAccount),
            });
          } catch (jsonError) {
            return NextResponse.json(
              { 
                message: 'Firebase Admin SDKの設定が見つかりません。環境変数またはfirebase-admin-key.jsonを設定してください。',
                error: 'Firebase Admin SDK not configured'
              },
              { status: 500 }
            );
          }
        }
      }

      // カスタムトークンを生成（LINEのユーザーIDをFirebaseのUIDとして使用）
      const customToken = await admin.auth().createCustomToken(lineProfile.sub);

      return NextResponse.json({ customToken });
    } catch (adminError) {
      console.error('Firebase Admin SDK error:', adminError);
      return NextResponse.json(
        { 
          message: 'Firebase Admin SDKの初期化に失敗しました',
          error: adminError instanceof Error ? adminError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { 
        message: '認証処理中にエラーが発生しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
