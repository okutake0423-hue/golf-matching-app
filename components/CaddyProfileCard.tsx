'use client';

import { useEffect, useState } from 'react';
import type { CaddyProfileDoc } from '@/types/caddy-profile';
import styles from './CaddyProfileCard.module.css';

function formatCreatedAt(doc: CaddyProfileDoc): string {
  const at = doc.createdAt as unknown;
  if (at && typeof at === 'object' && at !== null && 'toDate' in at) {
    const fn = (at as { toDate?: () => Date }).toDate;
    if (typeof fn === 'function') {
      try {
        return fn.call(at).toLocaleString('ja-JP');
      } catch {
        /* fallthrough */
      }
    }
  }
  if (at && typeof at === 'object' && at !== null && 'seconds' in at) {
    const s = (at as { seconds: number }).seconds;
    if (typeof s === 'number') {
      return new Date(s * 1000).toLocaleString('ja-JP');
    }
  }
  return '';
}

type Props = {
  profile: CaddyProfileDoc;
};

export function CaddyProfileCard({ profile }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const key = profile.photoS3Key;
    if (!key) {
      setPhotoErr(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/caddy-profiles/photo-url?key=${encodeURIComponent(key)}`
        );
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && typeof data.url === 'string') {
          setPhotoUrl(data.url);
        } else if (!cancelled) {
          setPhotoErr(true);
        }
      } catch {
        if (!cancelled) setPhotoErr(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.photoS3Key]);

  const created = formatCreatedAt(profile);

  return (
    <article className={styles.card}>
      <div className={styles.photoWrap}>
        {photoUrl && !photoErr ? (
          <img
            src={photoUrl}
            alt={`${profile.caddyName}の写真`}
            className={styles.photo}
          />
        ) : (
          <div className={styles.photoPlaceholder}>
            {photoErr ? '画像を表示できません' : '読み込み中...'}
          </div>
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.course}>{profile.golfCourseName}</p>
        <p className={styles.meta}>
          <strong>名前</strong>
          {profile.caddyName}
        </p>
        <p className={styles.meta}>
          <strong>番号</strong>
          {profile.caddyNumber}
        </p>
        <p className={styles.meta}>
          <strong>年齢</strong>
          {profile.age != null ? `${profile.age}歳` : '—'}
        </p>
        {created && (
          <p className={styles.date}>登録: {created}</p>
        )}
      </div>
    </article>
  );
}
