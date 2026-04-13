import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

export async function POST(request: NextRequest) {
  try {
    const { contentType } = await request.json().catch(() => ({}));
    const ct = typeof contentType === 'string' ? contentType : '';
    if (!ct.startsWith('image/')) {
      return NextResponse.json(
        { message: '画像ファイルのみ対応しています' },
        { status: 400 }
      );
    }

    const region = getEnv('AWS_REGION');
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
    // 旧表記（MATSUSITA...）や、全角アンダースコア（＿）にも対応
    const bucketNames = [
      'MATSUSHITA_KAI_S3_BUCKET',
      'MATSUSITA_KAI_S3_BUCKET',
      'MATSUSHITA_KAI_S3＿BUCKET',
      'MATSUSITA_KAI_S3＿BUCKET'
    ];
    const bucket = getEnv(...bucketNames);
    if (!bucket) {
      return NextResponse.json(
        {
          message: 'MATSUSHITA_KAI_S3_BUCKET is not set',
          missingVariables: ['MATSUSHITA_KAI_S3_BUCKET'],
          checked: bucketNames,
          envPresent: envPresence(bucketNames),
          hint: '環境変数名の全角/半角やスペルを確認し、devサーバー再起動 / Vercel Redeploy をしてください。',
        },
        { status: 500 }
      );
    }

    // 1枚限定（縦写真）。拡張子はcontent-typeから推定
    const ext = ct === 'image/png' ? 'png' : ct === 'image/webp' ? 'webp' : 'jpg';
    const key = `matsushita-kai/uploads/${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.${ext}`;

    const s3 = new S3Client({ region });
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: ct,
    });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });

    return NextResponse.json({ url, key, expiresInSec: 300 });
  } catch (e) {
    console.error('[matsushita-kai/upload-url]', e);
    const msg = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

