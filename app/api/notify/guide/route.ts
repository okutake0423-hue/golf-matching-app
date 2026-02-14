import { NextRequest, NextResponse } from 'next/server';

/**
 * 募集の参加者に案内メッセージをLINEで一括送信するAPI
 */
export async function POST(request: NextRequest) {
  try {
    const { participantUserIds, message } = await request.json();

    if (!Array.isArray(participantUserIds) || participantUserIds.length === 0) {
      return NextResponse.json(
        { message: '送信先の参加者がいません', sent: false },
        { status: 400 }
      );
    }

    const trimmedMessage = typeof message === 'string' ? message.trim() : '';
    if (!trimmedMessage) {
      return NextResponse.json(
        { message: '案内文を入力してください', sent: false },
        { status: 400 }
      );
    }

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelAccessToken || channelAccessToken === 'your_channel_access_token_here') {
      console.warn('[Guide Notify] LINE_CHANNEL_ACCESS_TOKEN が設定されていません。');
      return NextResponse.json(
        { message: 'LINE通知の設定がありません。案内を送信できません。', sent: false },
        { status: 200 }
      );
    }

    const lineMessage = {
      type: 'text' as const,
      text: trimmedMessage,
    };

    const maxBatchSize = 500;
    let sentCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < participantUserIds.length; i += maxBatchSize) {
      const batch = participantUserIds.slice(i, i + maxBatchSize);
      try {
        const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${channelAccessToken}`,
          },
          body: JSON.stringify({
            to: batch,
            messages: [lineMessage],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Guide Notify] LINE送信エラー:', response.status, errorText);
          errors.push(`送信に失敗しました (${response.status})`);
        } else {
          sentCount += batch.length;
        }
      } catch (err) {
        console.error('[Guide Notify] エラー:', err);
        errors.push('送信処理でエラーが発生しました');
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      sent: sentCount > 0,
      sentCount,
      totalTargets: participantUserIds.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Guide Notify] API error:', error);
    return NextResponse.json(
      {
        message: '案内の送信処理でエラーが発生しました',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
