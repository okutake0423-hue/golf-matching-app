import { NextRequest, NextResponse } from 'next/server';
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

type Participant = {
  displayName: string;
  group: string;
  grossOut: number | null;
  grossIn: number | null;
  handicap: number | null;
  netScore: number | null;
  rank: number | null;
};

function getEnv(...names: string[]): string | null {
  for (const name of names) {
    const v = process.env[name];
    if (v && String(v).trim()) return String(v).trim();
  }
  return null;
}

function envPresence(names: string[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const n of names) out[n] = !!(process.env[n] && String(process.env[n]).trim());
  return out;
}

function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function normalizeParticipants(arr: unknown): Participant[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => x as Record<string, unknown>)
    .map((r) => ({
      displayName: toString(r.displayName).trim(),
      group: toString(r.group).trim(),
      grossOut: toNumberOrNull(r.grossOut),
      grossIn: toNumberOrNull(r.grossIn),
      handicap: toNumberOrNull(r.handicap),
      netScore: toNumberOrNull(r.netScore),
      rank: toNumberOrNull(r.rank),
    }))
    .filter((p) => p.displayName !== '');
}

function getTextLinesFromTextract(blocks: any[]): string[] {
  const lines: string[] = [];
  for (const b of blocks ?? []) {
    if (b?.BlockType === 'LINE' && typeof b.Text === 'string') {
      lines.push(b.Text);
    }
  }
  return lines;
}

export async function POST(request: NextRequest) {
  try {
    const { s3Bucket, s3Key } = await request.json().catch(() => ({}));
    const bucketNames = [
      'MATSUSHITA_KAI_S3_BUCKET'
    ];
    const bucket =
      typeof s3Bucket === 'string' && s3Bucket.trim()
        ? s3Bucket.trim()
        : getEnv(...bucketNames);
    const key = typeof s3Key === 'string' ? s3Key.trim() : '';
    if (!key) {
      return NextResponse.json({ message: 's3Key が必要です' }, { status: 400 });
    }
    if (!bucket) {
      return NextResponse.json(
        {
          message: 'MATSUSHITA_KAI_S3_BUCKET is not set',
          missingVariables: ['MATSUSHITA_KAI_S3_BUCKET'],
          checked: bucketNames,
          envPresent: envPresence(bucketNames),
          hint: '.env.local を変更した場合は dev サーバー再起動、Vercel は Redeploy が必要です。',
        },
        { status: 500 }
      );
    }

    const region = getEnv('AWS_TEXTRACT_REGION', 'AWS_REGION');
    if (!region) {
      return NextResponse.json(
        {
          message: 'AWS_REGION is not set',
          missingVariables: ['AWS_REGION'],
          envPresent: envPresence(['AWS_REGION']),
          hint: '.env.local を変更した場合は dev サーバー再起動、Vercel は Redeploy が必要です。',
        },
        { status: 500 }
      );
    }
    const textract = new TextractClient({ region });
    let texRes: any;
    try {
      texRes = await textract.send(
        new AnalyzeDocumentCommand({
          Document: { S3Object: { Bucket: bucket, Name: key } },
          FeatureTypes: ['TABLES', 'FORMS'],
        })
      );
    } catch (texErr: any) {
      const meta = texErr?.$metadata;
      const errName = texErr?.name ?? '';
      const subscriptionHint =
        errName === 'SubscriptionRequiredException' ||
        String(texErr?.message ?? '').includes('subscription')
          ? 'このリージョンでは Amazon Textract が未提供、またはアカウントで利用開始されていない可能性が高いです。Textract対応リージョン（例: ap-southeast-1, ap-southeast-2, ap-northeast-1）に **S3バケットと AWS_S3_REGION / AWS_TEXTRACT_REGION を揃えて** ください（AnalyzeDocument の S3 参照は原則同一リージョンです）。'
          : 'IAM権限（textract:AnalyzeDocument）と、S3バケット/オブジェクトの参照権限、TextractとS3のリージョン一致を確認してください。';
      return NextResponse.json(
        {
          message: 'Textract の呼び出しに失敗しました',
          service: 'textract',
          operation: 'AnalyzeDocument',
          region,
          error: {
            name: texErr?.name,
            message: texErr?.message ?? String(texErr),
            httpStatusCode: meta?.httpStatusCode,
            requestId: meta?.requestId,
          },
          hint: subscriptionHint,
        },
        { status: 500 }
      );
    }

    const blocks = texRes.Blocks ?? [];
    const textLines = getTextLinesFromTextract(blocks);
    const rawText = textLines.join('\n');

    const modelId = getEnv('BEDROCK_MODEL_ID');
    if (!modelId) {
      return NextResponse.json(
        {
          message: 'BEDROCK_MODEL_ID is not set',
          missingVariables: ['BEDROCK_MODEL_ID'],
          envPresent: envPresence(['BEDROCK_MODEL_ID']),
        },
        { status: 500 }
      );
    }
    const bedrockRegion = getEnv('AWS_BEDROCK_REGION', 'AWS_REGION') ?? region;
    const bedrock = new BedrockRuntimeClient({ region: bedrockRegion });

    const systemPrompt =
      'あなたはゴルフコンペのスコア表（松下会）のOCR結果から、指定のJSON形式に整形するアシスタントです。' +
      '必ずJSONのみを返し、余計な文章は出力しません。';

    const userPrompt = [
      '以下はTextractのOCR結果テキストです（改行区切り）。',
      'このテキストから、松下会の記録データを抽出してJSONにしてください。',
      '',
      '【JSONスキーマ】',
      '{',
      '  "competitionName": string,',
      '  "golfCourseName": string,',
      '  "dateStr": "YYYY-MM-DD",',
      '  "participants": [',
      '    { "displayName": string, "group": string, "grossOut": number|null, "grossIn": number|null, "handicap": number|null, "netScore": number|null, "rank": number|null }',
      '  ]',
      '}',
      '',
      '【ルール】',
      '- 不明な項目は null または空文字にする（推測で埋めない）',
      '- participants は名前がある行のみ',
      '- Out/In は9Hずつのグロス',
      '- 数字は半角でJSON number（文字列にしない）',
      '',
      '--- OCR TEXT START ---',
      rawText,
      '--- OCR TEXT END ---',
    ].join('\n');

    let brRes: any;
    try {
      brRes = await bedrock.send(
        new ConverseCommand({
          modelId,
          system: [{ text: systemPrompt }],
          messages: [{ role: 'user', content: [{ text: userPrompt }] }],
          inferenceConfig: { temperature: 0 },
        })
      );
    } catch (brErr: any) {
      const meta = brErr?.$metadata;
      const msg = brErr?.message ?? String(brErr);
      const isSubscription =
        typeof msg === 'string' &&
        msg.toLowerCase().includes('subscription');
      return NextResponse.json(
        {
          message: 'Bedrock の呼び出しに失敗しました',
          service: 'bedrock',
          operation: 'Converse',
          region: bedrockRegion,
          modelId,
          error: {
            name: brErr?.name,
            message: msg,
            httpStatusCode: meta?.httpStatusCode,
            requestId: meta?.requestId,
          },
          hint: isSubscription
            ? 'BedrockのModel access（利用許可/サブスクリプション）を有効化してください。Bedrockコンソール→Model accessで対象モデルをEnable/Request access。'
            : 'IAM権限（bedrock:Converse または bedrock:InvokeModel）と、Bedrock対応リージョン、modelIdの一致を確認してください。',
        },
        { status: 500 }
      );
    }

    const contentParts = brRes.output?.message?.content as any[] | undefined;
    const outText =
      contentParts
        ?.map((c: any) => (c && typeof c === 'object' && 'text' in c ? c.text : ''))
        .join('') ?? '';

    // 余計な前後文が混ざっても拾えるように、最初の { 〜 最後の } を抜く
    const first = outText.indexOf('{');
    const last = outText.lastIndexOf('}');
    const jsonText = first >= 0 && last >= 0 ? outText.slice(first, last + 1) : outText;

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        {
          message: 'AIの解析結果をJSONとして解釈できませんでした',
          debug: { modelOutput: outText.slice(0, 2000) },
        },
        { status: 500 }
      );
    }

    const normalized = {
      competitionName: toString(parsed.competitionName).trim() || '松下会',
      golfCourseName: toString(parsed.golfCourseName).trim(),
      dateStr: toString(parsed.dateStr).trim(),
      participants: normalizeParticipants(parsed.participants),
    };

    return NextResponse.json({
      ...normalized,
      debug: {
        textractLineCount: textLines.length,
      },
    });
  } catch (e) {
    console.error('[matsushita-kai/analyze]', e);
    const msg = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

