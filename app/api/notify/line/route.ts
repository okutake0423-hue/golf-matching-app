import { NextRequest, NextResponse } from 'next/server';

/**
 * LINE通知を送信するAPI
 * 募集オーナーに参加通知を送る
 */
export async function POST(request: NextRequest) {
  try {
    const { ownerUserId, participantName, scheduleInfo } = await request.json();

    if (!ownerUserId || !participantName || !scheduleInfo) {
      return NextResponse.json(
        { message: '必要な情報が不足しています' },
        { status: 400 }
      );
    }

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelAccessToken || channelAccessToken === 'your_channel_access_token_here') {
      console.warn('LINE_CHANNEL_ACCESS_TOKEN が設定されていません。通知は送信されません。');
      return NextResponse.json(
        { message: 'LINE通知の設定がありません', sent: false },
        { status: 200 }
      );
    }

    // LINE Messaging APIでプッシュメッセージを送信
    const appUrl = 'https://golf-matching-app.vercel.app/';
    const venueLabel = scheduleInfo.venueName != null ? '場所' : 'コース';
    const venueValue = scheduleInfo.venueName ?? scheduleInfo.golfCourseName ?? '';
    const timeText = scheduleInfo.playTimeSlot != null
      ? `時間帯: ${scheduleInfo.playTimeSlot}${scheduleInfo.expectedPlayTime ? ` / ${scheduleInfo.expectedPlayTime}` : ''}`
      : `時間: ${scheduleInfo.startTime || ''}`;
    const message = {
      type: 'text',
      text: `${participantName}さんが以下の予定に参加しました。\n\n日付: ${scheduleInfo.dateStr}\n${timeText}\n${venueLabel}: ${venueValue}\n残り人数: ${scheduleInfo.remainingCount}名\n\nアプリ: ${appUrl}`,
    };

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: ownerUserId,
        messages: [message],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE通知送信エラー:', response.status, errorText);
      return NextResponse.json(
        { message: 'LINE通知の送信に失敗しました', sent: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, sent: true });
  } catch (error) {
    console.error('Notify API error:', error);
    return NextResponse.json(
      {
        message: '通知処理中にエラーが発生しました',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
