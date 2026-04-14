import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

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

    const region = getEnv('AWS_S3_REGION', 'AWS_REGION');
    if (!region) {
      return NextResponse.json(
        {
          message: 'AWS_REGION is not set',
          missingVariables: ['AWS_REGION'],
          envPresent: envPresence(['AWS_S3_REGION', 'AWS_REGION']),
          hint: '.env.local を変更した場合は dev サーバー再起動、Vercel は Redeploy が必要です。',
        },
        { status: 500 }
      );
    }

    const bucket = getEnv('CADDY_PROFILE_S3_BUCKET');
    if (!bucket) {
      return NextResponse.json(
        {
          message: 'CADDY_PROFILE_S3_BUCKET is not set',
          missingVariables: ['CADDY_PROFILE_S3_BUCKET'],
          envPresent: envPresence(['CADDY_PROFILE_S3_BUCKET']),
          hint: 'キャディー写真用のS3バケット名を環境変数に設定してください。',
        },
        { status: 500 }
      );
    }

    const ext = ct === 'image/png' ? 'png' : ct === 'image/webp' ? 'webp' : 'jpg';
    const key = `caddy-profiles/uploads/${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.${ext}`;

    const s3 = new S3Client({ region });
    const presigned = await createPresignedPost(s3, {
      Bucket: bucket,
      Key: key,
      Expires: 60 * 5,
      Conditions: [
        ['content-length-range', 1, 10 * 1024 * 1024],
        ['starts-with', '$Content-Type', 'image/'],
      ],
      Fields: {
        'Content-Type': ct,
      },
    });

    return NextResponse.json({
      url: presigned.url,
      fields: presigned.fields,
      key,
      expiresInSec: 300,
    });
  } catch (e) {
    console.error('[caddy-profiles/upload-url]', e);
    const msg = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
