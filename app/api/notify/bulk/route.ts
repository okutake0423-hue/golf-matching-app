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
      console.warn('LINE_CHANNEL_ACCESS_TOKEN が設定されていません。通知は送信されません。');
      return NextResponse.json(
        { message: 'LINE通知の設定がありません', sent: false, sentCount: 0 },
        { status: 200 }
      );
    }

    // Firebase Admin SDKを初期化
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      return NextResponse.json(
        {
          message: 'Firebase Admin SDKの設定が見つかりません',
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

    // Firestoreからプロフィール項目に該当するユーザーを検索
    const db = admin.firestore();
    const usersRef = db.collection('users');
    
    // array-contains-any を使用して、指定されたプロフィール項目のいずれかを含むユーザーを検索
    const querySnapshot = await usersRef
      .where('profileCheckboxes', 'array-contains-any', profileCheckboxes)
      .get();

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

    if (targetUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        sent: false,
        sentCount: 0,
        message: '該当するユーザーが見つかりませんでした',
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
          console.error(`LINE通知送信エラー (batch ${i / maxBatchSize + 1}):`, response.status, errorText);
          errors.push(`バッチ ${i / maxBatchSize + 1} の送信に失敗しました`);
        } else {
          sentCount += batch.length;
        }
      } catch (err) {
        console.error(`LINE通知送信エラー (batch ${i / maxBatchSize + 1}):`, err);
        errors.push(`バッチ ${i / maxBatchSize + 1} の送信に失敗しました`);
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount > 0,
      sentCount,
      totalTargets: targetUserIds.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Bulk notify API error:', error);
    return NextResponse.json(
      {
        message: '通知処理中にエラーが発生しました',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
