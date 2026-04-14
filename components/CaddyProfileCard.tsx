'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CaddyProfileDoc } from '@/types/caddy-profile';
import { getUserProfile } from '@/lib/firestore';
import { deleteCaddyProfile } from '@/lib/firestore-caddy';
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
  currentUserId: string | null;
  onDeleted?: () => void;
};

export function CaddyProfileCard({
  profile,
  currentUserId,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState(false);
  const [posterLabel, setPosterLabel] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  const isOwnPost =
    Boolean(currentUserId) && profile.posterId === currentUserId;

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

  useEffect(() => {
    const name = profile.posterDisplayName?.trim();
    if (name) {
      setPosterLabel(name);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const u = await getUserProfile(profile.posterId);
        if (!cancelled) {
          setPosterLabel(u?.displayName?.trim() || profile.posterId);
        }
      } catch {
        if (!cancelled) setPosterLabel(profile.posterId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.posterId, profile.posterDisplayName]);

  const created = formatCreatedAt(profile);

  const handleEdit = () => {
    if (!profile.id) return;
    router.push(`/caddy-profiles/${profile.id}/edit`);
  };

  const handleDelete = async () => {
    if (!profile.id || !isOwnPost) return;
    if (!confirm('このプロフィールを削除しますか？')) return;
    setDeleting(true);
    try {
      await deleteCaddyProfile(profile.id);
      onDeleted?.();
    } catch (e) {
      console.error(e);
      alert('削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.photoWrap}>
        {isOwnPost && profile.id && (
          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.editButton}
              onClick={handleEdit}
              aria-label="修正"
            >
              修正
            </button>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={handleDelete}
              disabled={deleting}
              aria-label="削除"
            >
              {deleting ? '…' : '×'}
            </button>
          </div>
        )}
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
        <p className={styles.posterName}>
          投稿者:{' '}
          <Link
            href={`/profile/${profile.posterId}`}
            className={styles.profileLink}
          >
            {posterLabel || '読み込み中...'}
          </Link>
        </p>
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
        {created && <p className={styles.date}>登録: {created}</p>}
      </div>
    </article>
  );
}
