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

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || !String(v).trim()) throw new Error(`${name} is not set`);
  return String(v).trim();
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
    const bucket =
      typeof s3Bucket === 'string' && s3Bucket.trim()
        ? s3Bucket.trim()
        : requiredEnv('MATSUSHITA_KAI_S3_BUCKET');
    const key = typeof s3Key === 'string' ? s3Key.trim() : '';
    if (!key) {
      return NextResponse.json({ message: 's3Key が必要です' }, { status: 400 });
    }

    const region = requiredEnv('AWS_REGION');
    const textract = new TextractClient({ region });
    const texRes = await textract.send(
      new AnalyzeDocumentCommand({
        Document: { S3Object: { Bucket: bucket, Name: key } },
        FeatureTypes: ['TABLES', 'FORMS'],
      })
    );

    const blocks = texRes.Blocks ?? [];
    const textLines = getTextLinesFromTextract(blocks);
    const rawText = textLines.join('\n');

    const modelId = requiredEnv('BEDROCK_MODEL_ID');
    const bedrock = new BedrockRuntimeClient({ region });

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

    const brRes = await bedrock.send(
      new ConverseCommand({
        modelId,
        system: [{ text: systemPrompt }],
        messages: [{ role: 'user', content: [{ text: userPrompt }] }],
        inferenceConfig: { temperature: 0 },
      })
    );

    const outText =
      brRes.output?.message?.content
        ?.map((c) => ('text' in c ? c.text : ''))
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

