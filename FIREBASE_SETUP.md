# FirebaseとLINE認証の連携設定ガイド

Firebase Authenticationには標準でLINEプロバイダーが存在しないため、カスタムトークンを使用してLINE認証を実装します。

## 手順

### 1. Firebase Admin SDKの設定

Firebase Admin SDKを使用してカスタムトークンを生成する必要があります。

#### 方法A: 環境変数で設定（推奨）

1. Firebase Consoleで「プロジェクトの設定」→「サービスアカウント」を開く
2. 「新しい秘密鍵の生成」をクリック
3. 表示される情報を`.env.local`に設定：

```env
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email@your_project_id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**注意**: `FIREBASE_ADMIN_PRIVATE_KEY`は改行文字（`\n`）を含むため、ダブルクォートで囲んでください。

#### 方法B: JSONファイルで設定

1. Firebase Consoleで「プロジェクトの設定」→「サービスアカウント」を開く
2. 「新しい秘密鍵の生成」をクリックしてJSONファイルをダウンロード
3. JSONファイルを`firebase-admin-key.json`としてプロジェクトルートに保存
4. `.gitignore`に追加されていることを確認（既に追加済み）

### 2. 動作確認

1. 開発サーバーを起動：
   ```bash
   npm run dev
   ```

2. ブラウザでアプリを開き、LINEログインを実行

3. ブラウザのコンソールとサーバーログを確認して、エラーがないか確認

## トラブルシューティング

### Firebase Admin SDKの初期化エラー

- 環境変数が正しく設定されているか確認
- `FIREBASE_ADMIN_PRIVATE_KEY`に改行文字（`\n`）が含まれているか確認
- JSONファイルを使用する場合、ファイルが正しい場所にあるか確認

### カスタムトークンの生成エラー

- Firebase Admin SDKが正しく初期化されているか確認
- サービスアカウントに適切な権限があるか確認（Firebase Authentication Admin権限が必要）

### IDトークンの検証エラー

- `NEXT_PUBLIC_LIFF_ID`が正しく設定されているか確認
- LIFFアプリが正しく作成されているか確認

## セキュリティに関する注意

- Firebase Admin SDKの秘密鍵は**絶対に**クライアントサイドに公開しないでください
- 環境変数やJSONファイルは`.gitignore`に追加されていることを確認してください
- 本番環境では、環境変数を使用することを強く推奨します

---

## （追加）松下会記録：画像アップロード（AWS Textract + Bedrock）

松下会のスコア表（スマホ縦写真・固定フォーマット・1枚）をアップロードしてAI判定し、フォームに反映する機能があります。

### 必要な環境変数（`.env.local` / Vercel）

```env
# AWS
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=xxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxx

# S3（アップロード先バケット名）
MATSUSHITA_KAI_S3_BUCKET=your-bucket-name

# Bedrock（Converse対応モデルID）
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
```

### AWS側の前提

- **S3バケット**は非公開（公開アクセスOFF）
- 画像は **Presigned URL** でアップロード（有効期限5分）
- IAM権限（例）
  - S3: `PutObject`（対象prefixのみ推奨）
  - Textract: `AnalyzeDocument`
  - Bedrock: `bedrock:InvokeModel` / `bedrock:Converse`

### API（Next.js）

- `POST /api/matsushita-kai/upload-url` … Presigned URLを返す
- `POST /api/matsushita-kai/analyze` … Textract→Bedrockで解析して `MatsushitaKaiRecordFormData` 相当のJSONを返す
