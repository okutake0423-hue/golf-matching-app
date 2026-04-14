'use client';

import { useState, useCallback, useEffect } from 'react';
import styles from './CaddyProfileForm.module.css';

export type CaddyProfileSubmitPayload = {
  golfCourseName: string;
  caddyName: string;
  caddyNumber: string;
  age: number | null;
  /** 新規は必須。編集は未選択なら null（既存画像を維持） */
  photoFile: File | null;
};

type Props = {
  variant?: 'create' | 'edit';
  initialValues?: {
    golfCourseName: string;
    caddyName: string;
    caddyNumber: string;
    age: number | null;
  };
  onSubmit: (data: CaddyProfileSubmitPayload) => Promise<void>;
  submitting?: boolean;
};

export function CaddyProfileForm({
  variant = 'create',
  onSubmit,
  submitting,
  initialValues,
}: Props) {
  const [golfCourseName, setGolfCourseName] = useState('');
  const [caddyName, setCaddyName] = useState('');
  const [caddyNumber, setCaddyNumber] = useState('');
  const [ageStr, setAgeStr] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEdit = variant === 'edit';

  useEffect(() => {
    if (!initialValues || !isEdit) return;
    setGolfCourseName(initialValues.golfCourseName);
    setCaddyName(initialValues.caddyName);
    setCaddyNumber(initialValues.caddyNumber);
    setAgeStr(
      initialValues.age != null && Number.isFinite(initialValues.age)
        ? String(initialValues.age)
        : ''
    );
    setPhotoFile(null);
  }, [initialValues, isEdit]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!golfCourseName.trim()) {
        setError('ゴルフコースを入力してください');
        return;
      }
      if (!caddyName.trim()) {
        setError('キャディー名を入力してください');
        return;
      }
      if (!caddyNumber.trim()) {
        setError('番号を入力してください');
        return;
      }
      if (!isEdit && !photoFile) {
        setError('写真を選択してください');
        return;
      }
      let age: number | null = null;
      if (ageStr.trim() !== '') {
        const n = parseInt(ageStr, 10);
        if (!Number.isFinite(n) || n < 0 || n > 120) {
          setError('年齢は0〜120の数値で入力してください');
          return;
        }
        age = n;
      }
      await onSubmit({
        golfCourseName: golfCourseName.trim(),
        caddyName: caddyName.trim(),
        caddyNumber: caddyNumber.trim(),
        age,
        photoFile: photoFile ?? null,
      });
    },
    [
      golfCourseName,
      caddyName,
      caddyNumber,
      ageStr,
      photoFile,
      onSubmit,
      isEdit,
    ]
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>
        {isEdit ? 'キャディープロフィールを修正' : 'キャディープロフィールを登録'}
      </h2>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.field}>
        <label htmlFor="cp-course" className={styles.label}>
          ゴルフコース
        </label>
        <input
          id="cp-course"
          type="text"
          value={golfCourseName}
          onChange={(e) => setGolfCourseName(e.target.value)}
          className={styles.input}
          disabled={submitting}
          placeholder="例: ○○ゴルフクラブ"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="cp-name" className={styles.label}>
          キャディー名
        </label>
        <input
          id="cp-name"
          type="text"
          value={caddyName}
          onChange={(e) => setCaddyName(e.target.value)}
          className={styles.input}
          disabled={submitting}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="cp-num" className={styles.label}>
            番号
          </label>
          <input
            id="cp-num"
            type="text"
            inputMode="numeric"
            value={caddyNumber}
            onChange={(e) => setCaddyNumber(e.target.value)}
            className={styles.input}
            disabled={submitting}
            placeholder="例: 12"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="cp-age" className={styles.label}>
            年齢（任意）
          </label>
          <input
            id="cp-age"
            type="number"
            min={0}
            max={120}
            value={ageStr}
            onChange={(e) => setAgeStr(e.target.value)}
            className={styles.input}
            disabled={submitting}
            placeholder="例: 28"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="cp-photo" className={styles.label}>
          写真{isEdit ? '（変更する場合のみ選択）' : ''}
        </label>
        <input
          id="cp-photo"
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          disabled={submitting}
        />
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submit}
          disabled={submitting}
        >
          {submitting
            ? isEdit
              ? '保存中...'
              : '登録中...'
            : isEdit
              ? '保存する'
              : '登録する'}
        </button>
      </div>
    </form>
  );
}
