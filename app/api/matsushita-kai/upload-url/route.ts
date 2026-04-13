import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function requiredEnv(...names: string[]): string {
  for (const name of names) {
    const v = process.env[name];
    if (v && String(v).trim()) return String(v).trim();
  }
  throw new Error(`${names[0]} is not set`);
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

    const region = requiredEnv('AWS_REGION');
    // 旧表記の取り込み（MATSUSITA...）にも対応
    const bucket = requiredEnv('MATSUSHITA_KAI_S3_BUCKET', 'MATSUSITA_KAI_S3_BUCKET');

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

