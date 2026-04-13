'use client';

import { useCallback, useMemo, useState } from 'react';
import type { MatsushitaKaiRecordFormData } from '@/types/matsushita-kai';
import styles from './MatsushitaKaiImageImport.module.css';

type Props = {
  onImported: (data: MatsushitaKaiRecordFormData) => void;
};

type Stage = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

export function MatsushitaKaiImageImport({ onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);

  const canStart = useMemo(() => file != null && (stage === 'idle' || stage === 'error' || stage === 'done'), [file, stage]);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setError(null);
    setStage('uploading');
    try {
      // 1) presigned url 取得
      const presignRes = await fetch('/api/matsushita-kai/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type || 'image/jpeg' }),
      });
      const presignData = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok) {
        throw new Error(presignData.message || 'アップロードURLの取得に失敗しました');
      }

      const { url, key } = presignData as { url?: string; key?: string };
      const { fields } = presignData as { fields?: Record<string, string> };
      if (!url || !key || !fields) throw new Error('アップロードURLの取得結果が不正です');

      // 2) S3へアップロード（Presigned POST）
      let putRes: Response;
      try {
        const form = new FormData();
        for (const [k, v] of Object.entries(fields)) {
          form.append(k, v);
        }
        form.append('file', file);
        putRes = await fetch(url, { method: 'POST', body: form });
      } catch (putErr) {
        // iOS Safari などで CORS/ネットワークエラー時に "Load failed" になりやすい
        const raw =
          putErr instanceof Error ? putErr.message : String(putErr);
        const hint =
          'S3のCORS設定（AllowedOrigin/AllowedMethod=POST）と、AWS_REGIONがバケットのリージョンと一致しているか確認してください。';
        throw new Error(`${raw}\n\n${hint}`);
      }
      if (!putRes.ok) {
        throw new Error(`画像アップロードに失敗しました (${putRes.status})`);
      }

      // 3) 解析（Textract→Bedrock）
      setStage('analyzing');
      const analyzeRes = await fetch('/api/matsushita-kai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Key: key }),
      });
      const analyzeData = await analyzeRes.json().catch(() => ({}));
      if (!analyzeRes.ok) {
        throw new Error(analyzeData.message || '解析に失敗しました');
      }

      const imported: MatsushitaKaiRecordFormData = {
        competitionName: analyzeData.competitionName ?? '松下会',
        golfCourseName: analyzeData.golfCourseName ?? '',
        dateStr: analyzeData.dateStr ?? '',
        participants: Array.isArray(analyzeData.participants) ? analyzeData.participants : [],
      };

      onImported(imported);
      setStage('done');
    } catch (e) {
      console.error('[MatsushitaKaiImageImport]', e);
      setError(e instanceof Error ? e.message : '解析に失敗しました');
      setStage('error');
    }
  }, [file, onImported]);

  return (
    <section className={styles.wrap} aria-label="画像から入力">
      <h3 className={styles.title}>画像から入力（AI判定）</h3>
      <p className={styles.hint}>
        松下会のスコア表（縦写真・1枚）をアップロードすると、AIが項目を抽出してフォームに反映します。
      </p>

      <div className={styles.row}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={stage === 'uploading' || stage === 'analyzing'}
        />
        <button
          type="button"
          className={styles.button}
          onClick={handleAnalyze}
          disabled={!canStart}
        >
          {stage === 'uploading'
            ? 'アップロード中...'
            : stage === 'analyzing'
              ? '解析中...'
              : '解析して反映'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {stage === 'done' && <div className={styles.done}>フォームに反映しました。内容を確認して保存してください。</div>}
    </section>
  );
}

