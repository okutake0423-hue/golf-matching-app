import { NextRequest, NextResponse } from 'next/server';
import type { ProfileCheckboxValue } from '@/types/profile';

/**
 * プロフィール項目でユーザーを検索してLINE通知を一括送信するAPI
 */
export async function POST(request: NextRequest) {
  try {
    const { profileCheckboxes, scheduleInfo } = await request.json();

    if (!profileCheckboxes || !Array.isArray(profileCheckboxes) || profileCheckboxes.length === 0) {
      return NextResponse.json(
        { message: 'プロフィール項目が指定されていません' },
        { status: 400 }
      );
    }

    if (!scheduleInfo) {
      return NextResponse.json(
        { message: '予定情報が指定されていません' },
        { status: 400 }
      );
    }

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelAccessToken || channelAccessToken === 'your_channel_access_token_here') {
      console.warn('[Bulk Notify] LINE_CHANNEL_ACCESS_TOKEN が設定されていません。通知は送信されません。');
      return NextResponse.json(
        { 
          success: false,
          message: 'LINE通知の設定がありません。Vercelの環境変数に LINE_CHANNEL_ACCESS_TOKEN を設定してください。', 
          sent: false, 
          sentCount: 0 
        },
        { status: 200 }
      );
    }
    
    console.log('[Bulk Notify] 通知送信開始:', {
      profileCheckboxes,
      scheduleInfo,
      channelAccessTokenSet: !!channelAccessToken,
    });

    // Firebase Admin SDKを初期化
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    console.log('[Bulk Notify] Firebase Admin SDK設定確認:', {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      projectId: projectId || '未設定',
      clientEmail: clientEmail ? `${clientEmail.substring(0, 20)}...` : '未設定',
    });

    if (!projectId || !clientEmail || !privateKey) {
      const missingVars = [];
      if (!projectId) missingVars.push('FIREBASE_ADMIN_PROJECT_ID');
      if (!clientEmail) missingVars.push('FIREBASE_ADMIN_CLIENT_EMAIL');
      if (!privateKey) missingVars.push('FIREBASE_ADMIN_PRIVATE_KEY');
      
      return NextResponse.json(
        {
          success: false,
          message: `Firebase Admin SDKの設定が見つかりません。以下の環境変数が設定されていません: ${missingVars.join(', ')}\n\nVercelの場合は、Settings → Environment Variables で設定し、Redeployしてください。`,
          error: 'Firebase Admin SDK not configured',
          missingVariables: missingVars,
        },
        { status: 500 }
      );
    }

    let admin;
    try {
      // 動的インポートを使用して、ビルド時の依存関係の問題を回避
      admin = await import('firebase-admin');
    } catch (importError) {
      const errorMessage = importError instanceof Error ? importError.message : String(importError);
      console.error('[Bulk Notify] Firebase Admin SDKのインポートエラー:', {
        error: errorMessage,
        stack: importError instanceof Error ? importError.stack : undefined,
        name: importError instanceof Error ? importError.name : 'Unknown',
      });
      
      // OpenTelemetry関連のエラーの場合の特別なメッセージ
      if (errorMessage.includes('@opentele') || errorMessage.includes('opentelemetry')) {
        return NextResponse.json(
          {
            success: false,
            message: `Firebase Admin SDKの依存関係エラーが発生しました。Vercelのビルドログを確認してください。\n\nエラー: ${errorMessage}\n\n対処: package.jsonをコミット・プッシュして、Vercelで再デプロイしてください。`,
            error: errorMessage,
            requiresRebuild: true,
          },
          { status: 500 }
        );
      }
      
      throw new Error(`Firebase Admin SDKのインポートに失敗しました: ${errorMessage}`);
    }

    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log('[Bulk Notify] Firebase Admin SDK初期化成功');
      } catch (initError) {
        console.error('[Bulk Notify] Firebase Admin SDK初期化エラー:', {
          error: initError instanceof Error ? initError.message : String(initError),
          stack: initError instanceof Error ? initError.stack : undefined,
        });
        throw new Error(`Firebase Admin SDKの初期化に失敗しました: ${initError instanceof Error ? initError.message : String(initError)}`);
      }
    }

    // Firestoreからプロフィール項目に該当するユーザーを検索
    let querySnapshot;
    try {
      const db = admin.firestore();
      const usersRef = db.collection('users');
      
      // array-contains-any を使用して、指定されたプロフィール項目のいずれかを含むユーザーを検索
      querySnapshot = await usersRef
        .where('profileCheckboxes', 'array-contains-any', profileCheckboxes)
        .get();
      
      console.log('[Bulk Notify] Firestoreクエリ成功:', {
        querySize: querySnapshot.size,
      });
    } catch (queryError) {
      console.error('[Bulk Notify] Firestoreクエリエラー:', {
        error: queryError instanceof Error ? queryError.message : String(queryError),
        stack: queryError instanceof Error ? queryError.stack : undefined,
      });
      
      const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
      
      // インデックスが必要な場合のエラーメッセージを改善
      if (errorMessage.includes('index') || errorMessage.includes('Index')) {
        return NextResponse.json(
          {
            success: false,
            message: `Firestoreのインデックスが必要です。エラーメッセージ内のリンクからインデックスを作成してください。\n\nエラー: ${errorMessage}`,
            error: errorMessage,
            requiresIndex: true,
          },
          { status: 500 }
        );
      }
      
      throw new Error(`ユーザー検索に失敗しました: ${errorMessage}`);
    }

    const targetUserIds: string[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const userId = data.userId || doc.id;
      const userCheckboxes = data.profileCheckboxes || [];
      
      // 選択されたプロフィール項目のいずれかを含むユーザーのみを対象とする
      const hasMatchingCheckbox = profileCheckboxes.some((checkbox: ProfileCheckboxValue) =>
        userCheckboxes.includes(checkbox)
      );
      
      if (hasMatchingCheckbox && userId) {
        targetUserIds.push(userId);
      }
    });

    console.log('[Bulk Notify] 検索結果:', {
      profileCheckboxes,
      foundUsers: targetUserIds.length,
      userIds: targetUserIds.slice(0, 5), // 最初の5件のみログ出力
    });

    if (targetUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        sent: false,
        sentCount: 0,
        message: '該当するユーザーが見つかりませんでした。プロフィール項目を選択しているユーザーがいない可能性があります。',
      });
    }

    // 通知メッセージを作成
    const scheduleText = scheduleInfo.isCompetition && scheduleInfo.competitionName
      ? `【${scheduleInfo.competitionName}】\n日付: ${scheduleInfo.dateStr}\n時間: ${scheduleInfo.startTime || ''}\nコース: ${scheduleInfo.golfCourseName}`
      : `日付: ${scheduleInfo.dateStr}\n時間: ${scheduleInfo.startTime || ''}\nコース: ${scheduleInfo.golfCourseName}`;

    const message = {
      type: 'text',
      text: `新しいゴルフ予定が投稿されました！\n\n${scheduleText}\n\n詳細はアプリでご確認ください。`,
    };

    // 複数ユーザーにLINE通知を送信
    let sentCount = 0;
    const errors: string[] = [];

    // LINE Messaging APIのmulticastを使用（最大500ユーザーまで）
    const maxBatchSize = 500;
    for (let i = 0; i < targetUserIds.length; i += maxBatchSize) {
      const batch = targetUserIds.slice(i, i + maxBatchSize);
      
      try {
        const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${channelAccessToken}`,
          },
          body: JSON.stringify({
            to: batch,
            messages: [message],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`LINE通知送信エラー (batch ${Math.floor(i / maxBatchSize) + 1}):`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            batchSize: batch.length,
            userIds: batch.slice(0, 3), // 最初の3件のみログ出力
          });
          errors.push(`バッチ ${Math.floor(i / maxBatchSize) + 1} の送信に失敗しました`);
        } else {
          const responseData = await response.json().catch(() => ({}));
          console.log(`LINE通知送信成功 (batch ${Math.floor(i / maxBatchSize) + 1}):`, {
            sentCount: batch.length,
            response: responseData,
          });
          sentCount += batch.length;
        }
      } catch (err) {
        console.error(`LINE通知送信エラー (batch ${i / maxBatchSize + 1}):`, err);
        errors.push(`バッチ ${i / maxBatchSize + 1} の送信に失敗しました`);
      }
    }

    const result = {
      success: true,
      sent: sentCount > 0,
      sentCount,
      totalTargets: targetUserIds.length,
      errors: errors.length > 0 ? errors : undefined,
    };
    
    console.log('[Bulk Notify] 通知送信完了:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Bulk Notify] エラー発生:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      fullError: String(error),
    });
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : { error: String(error) };
    
    return NextResponse.json(
      {
        success: false,
        message: `通知処理中にエラーが発生しました: ${errorMessage}`,
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
