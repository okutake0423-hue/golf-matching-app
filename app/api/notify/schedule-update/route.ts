import { NextRequest, NextResponse } from 'next/server';

/**
 * 募集予定の変更を参加者にLINEで通知するAPI
 */
export async function POST(request: NextRequest) {
  try {
    const { participantUserIds, scheduleInfo } = await request.json();

    if (!Array.isArray(participantUserIds)) {
      return NextResponse.json(
        { message: '送信先が不正です', sent: false },
        { status: 400 }
      );
    }

    const text =
      typeof scheduleInfo === 'string'
        ? scheduleInfo
        : scheduleInfo?.summary ?? '以下の予定が更新されました。アプリでご確認ください。';

    if (participantUserIds.length === 0) {
      return NextResponse.json({ success: true, sent: false, sentCount: 0 });
    }

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelAccessToken || channelAccessToken === 'your_channel_access_token_here') {
      console.warn('[Schedule Update Notify] LINE_CHANNEL_ACCESS_TOKEN が設定されていません。');
      return NextResponse.json(
        { message: 'LINE通知の設定がありません', sent: false },
        { status: 200 }
      );
    }

    const message = { type: 'text' as const, text };
    const maxBatchSize = 500;
    let sentCount = 0;

    for (let i = 0; i < participantUserIds.length; i += maxBatchSize) {
      const batch = participantUserIds.slice(i, i + maxBatchSize);
      const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${channelAccessToken}`,
        },
        body: JSON.stringify({ to: batch, messages: [message] }),
      });
      if (response.ok) sentCount += batch.length;
    }

    return NextResponse.json({
      success: true,
      sent: sentCount > 0,
      sentCount,
    });
  } catch (error) {
    console.error('[Schedule Update Notify] error:', error);
    return NextResponse.json(
      {
        message: '通知の送信に失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
