import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getEnv(...names: string[]): string | null {
  for (const name of names) {
    const v = process.env[name];
    if (v && String(v).trim()) return String(v).trim();
  }
  return null;
}

const ALLOWED_PREFIX = 'caddy-profiles/';

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key')?.trim() ?? '';
    if (!key || !key.startsWith(ALLOWED_PREFIX)) {
      return NextResponse.json(
        { message: '無効なキーです' },
        { status: 400 }
      );
    }

    const region = getEnv('AWS_S3_REGION', 'AWS_REGION');
    const bucket = getEnv('CADDY_PROFILE_S3_BUCKET');
    if (!region || !bucket) {
      return NextResponse.json(
        { message: 'S3の設定が不足しています' },
        { status: 500 }
      );
    }

    const s3 = new S3Client({ region });
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });

    return NextResponse.json({ url, expiresInSec: 3600 });
  } catch (e) {
    console.error('[caddy-profiles/photo-url]', e);
    const msg = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
