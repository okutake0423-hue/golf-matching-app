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

/** 連続空行を1行にまとめ、行末空白を除き入力トークンを抑える */
function compactOcrText(text: string): string {
  const lines = text.split('\n').map((l) => l.trimEnd());
  const out: string[] = [];
  let prevEmpty = false;
  for (const line of lines) {
    const empty = line.trim() === '';
    if (empty && prevEmpty) continue;
    out.push(empty ? '' : line);
    prevEmpty = empty;
  }
  return out.join('\n').trim();
}

/** Converse 応答のトークン使用量（SDK / モデルでキー名が揃わない場合に備えて緩く取得） */
function extractBedrockUsage(res: unknown): {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
} {
  if (!res || typeof res !== 'object') return {};
  const r = res as Record<string, unknown>;
  const u = (r.usage ??
    (r as { Usage?: unknown }).Usage) as Record<string, unknown> | undefined;
  if (!u || typeof u !== 'object') return {};
  const num = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined;
  return {
    inputTokens:
      num(u.inputTokens) ??
      num(u.inputTokenCount) ??
      num((u as { input_tokens?: unknown }).input_tokens),
    outputTokens:
      num(u.outputTokens) ??
      num(u.outputTokenCount) ??
      num((u as { output_tokens?: unknown }).output_tokens),
    totalTokens:
      num(u.totalTokens) ?? num((u as { total_tokens?: unknown }).total_tokens),
  };
}

/** ログ用: OCR 本文の先頭・末尾だけ（全文は長大になりうるため） */
function ocrTextForLogPreview(text: string, head = 240, tail = 120): string {
  if (text.length <= head + tail + 20) return text;
  return `${text.slice(0, head)}\n… (${text.length} chars) …\n${text.slice(-tail)}`;
}

const LOG_PREFIX = '[matsushita-kai/analyze]';

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
    const rawText = compactOcrText(textLines.join('\n'));

    // Claude 4 系などはオンデマンドの modelId ではなく「推論プロファイル」が必要な場合がある。
    // Converse の modelId には推論プロファイルID（またはARN）を渡せる。
    const modelId = getEnv(
      'BEDROCK_INFERENCE_PROFILE_ID',
      'BEDROCK_MODEL_ID'
    );
    if (!modelId) {
      return NextResponse.json(
        {
          message:
            'BEDROCK_INFERENCE_PROFILE_ID または BEDROCK_MODEL_ID を設定してください',
          missingVariables: [
            'BEDROCK_INFERENCE_PROFILE_ID',
            'BEDROCK_MODEL_ID',
          ],
          envPresent: envPresence([
            'BEDROCK_INFERENCE_PROFILE_ID',
            'BEDROCK_MODEL_ID',
          ]),
          hint: 'anthropic.claude-sonnet-4-6 等で「inference profile が必要」というエラーが出る場合は、Bedrockコンソールの Inference profiles でプロファイルIDを確認し、BEDROCK_INFERENCE_PROFILE_ID に設定してください。',
        },
        { status: 500 }
      );
    }
    const bedrockRegion = getEnv('AWS_BEDROCK_REGION', 'AWS_REGION') ?? region;
    const bedrock = new BedrockRuntimeClient({ region: bedrockRegion });

    // コンペ名・コース・日付は画像からは取れない前提のため Bedrock には participants のみ依頼しトークンを抑える
    const systemPrompt =
      '松下会スコア表のOCRテキストから参加者配列だけをJSONで返す。出力はJSONオブジェクトのみ（説明文禁止）。';

    const userPrompt = [
      'OCR:',
      rawText,
      '',
      '返却形式: {"participants":[{"displayName":"","group":"","grossOut":null,"grossIn":null,"handicap":null,"netScore":null,"rank":null}]}',
      'ルール: 名がある行のみ; 不明はnull; Out/Inは各9Hグロス; 数値はJSONのnumber。',
    ].join('\n');

    const maxTokensEnv = getEnv('BEDROCK_MAX_OUTPUT_TOKENS');
    const maxTokens = maxTokensEnv
      ? Math.min(8192, Math.max(256, parseInt(maxTokensEnv, 10) || 2048))
      : 2048;

    const verbosePromptLog =
      getEnv('MATSUSHITA_KAI_ANALYZE_VERBOSE_LOG', 'ANALYZE_VERBOSE_LOG') ===
        '1' ||
      getEnv('MATSUSHITA_KAI_ANALYZE_VERBOSE_LOG', 'ANALYZE_VERBOSE_LOG') ===
        'true';

    const bedrockPreRequest = {
      phase: 'before_bedrock_converse' as const,
      s3Bucket: bucket,
      s3Key: key,
      textractLineCount: textLines.length,
      ocrCharCount: rawText.length,
      systemPromptCharLength: systemPrompt.length,
      userPromptCharLength: userPrompt.length,
      /** 厳密なトークン数ではないが、入力サイズの目安 */
      approxCombinedCharLength: systemPrompt.length + userPrompt.length,
      bedrockRegion,
      modelId,
      inferenceConfig: { temperature: 0, maxTokens },
      ocrTextPreview: ocrTextForLogPreview(rawText),
    };
    console.log(LOG_PREFIX, JSON.stringify(bedrockPreRequest));
    if (verbosePromptLog) {
      console.log(LOG_PREFIX, 'systemPrompt全文:\n', systemPrompt);
      console.log(LOG_PREFIX, 'userPrompt全文:\n', userPrompt);
    }

    let brRes: any;
    try {
      brRes = await bedrock.send(
        new ConverseCommand({
          modelId,
          system: [{ text: systemPrompt }],
          messages: [{ role: 'user', content: [{ text: userPrompt }] }],
          inferenceConfig: { temperature: 0, maxTokens },
        })
      );
    } catch (brErr: any) {
      const meta = brErr?.$metadata;
      const httpStatus = meta?.httpStatusCode;
      const msg = brErr?.message ?? String(brErr);
      const msgLower = typeof msg === 'string' ? msg.toLowerCase() : '';
      const errName = brErr?.name ?? '';
      const isSubscription = msgLower.includes('subscription');
      const needsInferenceProfile =
        msgLower.includes('inference profile') ||
        msgLower.includes('on-demand throughput');
      const isTokenQuota =
        errName === 'ThrottlingException' ||
        httpStatus === 429 ||
        msgLower.includes('tokens per day') ||
        msgLower.includes('too many tokens');
      let bedrockHint =
        'IAM権限（bedrock:Converse または bedrock:InvokeModel）と、Bedrock対応リージョン、modelIdの一致を確認してください。';
      if (isTokenQuota) {
        bedrockHint =
          'Bedrockの日次トークン上限（またはレート制限）に達しています。しばらく待ってから再試行するか、AWS Service Quotas で対象モデル/リージョンのクォータ引き上げを申請してください。開発中はより軽いモデルや推論プロファイルの切り替えも検討できます。';
      } else if (isSubscription) {
        bedrockHint =
          'BedrockのModel access（利用許可/サブスクリプション）を有効化してください。Bedrockコンソール→Model accessで対象モデルをEnable/Request access。';
      } else       if (needsInferenceProfile) {
        bedrockHint =
          'このモデルはオンデマンドのモデルIDでは呼べません。AWSコンソール → Amazon Bedrock → Inference profiles で、利用するリージョンの「推論プロファイルID」（またはARN）をコピーし、環境変数 BEDROCK_INFERENCE_PROFILE_ID に設定してください（従来の BEDROCK_MODEL_ID は空にするか、推論プロファイルを優先します）。';
      }
      console.error(
        LOG_PREFIX,
        'Bedrock 失敗時の直前情報',
        JSON.stringify(bedrockPreRequest)
      );
      console.error(
        LOG_PREFIX,
        'Bedrock エラー',
        brErr?.name,
        brErr?.message,
        'requestId:',
        meta?.requestId
      );
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
          hint: bedrockHint,
          debug: {
            bedrockPreRequest,
          },
        },
        { status: 500 }
      );
    }

    const bedrockUsage = extractBedrockUsage(brRes);
    const awsRequestId = (brRes as { $metadata?: { requestId?: string } })
      ?.$metadata?.requestId;
    const postBedrock = {
      phase: 'after_bedrock_converse' as const,
      ...bedrockUsage,
      stopReason: brRes?.stopReason,
      awsRequestId,
    };
    console.log(LOG_PREFIX, JSON.stringify(postBedrock));

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

    // コンペ名・コース・日付は手入力前提（画像からは抽出しない）。Bedrock 出力は使わない。
    const normalized = {
      competitionName: '松下会',
      golfCourseName: '',
      dateStr: '',
      participants: normalizeParticipants(parsed.participants),
    };

    return NextResponse.json({
      ...normalized,
      debug: {
        textractLineCount: textLines.length,
        ocrCharCount: rawText.length,
        bedrockMaxOutputTokens: maxTokens,
        prompt: {
          systemCharLength: systemPrompt.length,
          userCharLength: userPrompt.length,
          combinedCharLength: systemPrompt.length + userPrompt.length,
        },
        bedrock: {
          region: bedrockRegion,
          modelId,
          inferenceConfig: { temperature: 0, maxTokens },
          usage: bedrockUsage,
          stopReason: brRes?.stopReason ?? null,
          awsRequestId: awsRequestId ?? null,
        },
        bedrockPreRequest,
      },
    });
  } catch (e) {
    console.error('[matsushita-kai/analyze]', e);
    const msg = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

