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

# （推奨）推論プロファイル経由で呼ぶ場合（Claude 4 系などで on-demand が使えないとき）
# Bedrockコンソール → Inference profiles で ID または ARN をコピー
# BEDROCK_INFERENCE_PROFILE_ID=xxxxxxxx

# （任意）リージョンを分けたい場合（S3/Textract/Bedrock）
AWS_S3_REGION=ap-northeast-1
AWS_TEXTRACT_REGION=ap-northeast-1
AWS_BEDROCK_REGION=ap-northeast-1
```

#### Bedrock で「inference profile が必要」というエラーが出る場合

`Invocation of model ID ... with on-demand throughput isn't supported` のように出る場合、**モデルIDそのものではなく推論プロファイル**で呼ぶ必要があります。

1. AWSコンソール → **Amazon Bedrock** → **Inference profiles**
2. リージョン（例: `ap-southeast-1`）で利用可能なプロファイルの **ID または ARN** をコピー
3. 環境変数 **`BEDROCK_INFERENCE_PROFILE_ID`** に設定（この値があれば `BEDROCK_MODEL_ID` より優先されます）

### AWS側の前提

- **S3バケット**は非公開（公開アクセスOFF）
- 画像は **Presigned URL** でアップロード（有効期限5分）
- IAM権限（例）
  - S3: `PutObject`（対象prefixのみ推奨）
  - Textract: `AnalyzeDocument`
  - Bedrock: `bedrock:InvokeModel` / `bedrock:Converse`

### Textract が `SubscriptionRequiredException` になる場合

`The AWS Access Key Id needs a subscription for the service` は、**IAM不足ではなく「そのリージョンで Textract が使えない」**ことが多いです（例: 一部の新リージョンでは Textract 未対応）。

**対処（推奨）**

1. [Amazon Textract のリージョン一覧](https://docs.aws.amazon.com/general/latest/gr/textract.html) で **Textract が提供されているリージョン**を選ぶ（例: `ap-southeast-1`, `ap-southeast-2`, `ap-northeast-1`）。
2. **そのリージョンに S3 バケットを用意**し、`MATSUSHITA_KAI_S3_BUCKET` と `AWS_S3_REGION` をそこに合わせる。
3. `AWS_TEXTRACT_REGION` を **S3 と同じリージョン**にする（`AnalyzeDocument` の S3 参照は原則同一リージョン）。
4. Bedrock だけ別リージョンにしたい場合は `AWS_BEDROCK_REGION` のみ分ける。

※ `ap-southeast-7` などで Textract を使う場合は、AWS コンソールで当該リージョンに Textract が表示されるか・利用可能かを先に確認してください。

### API（Next.js）

- `POST /api/matsushita-kai/upload-url` … Presigned URLを返す
- `POST /api/matsushita-kai/analyze` … Textract→Bedrockで解析して `MatsushitaKaiRecordFormData` 相当のJSONを返す

---

## （追加）キャディープロフィール：写真をS3、メタデータをFirestore

ゴルフコース・キャディー名・番号・年齢・写真を登録し、一覧で確認できます。

### 環境変数

```env
# キャディー写真専用のS3バケット（新規作成して名前を設定）
CADDY_PROFILE_S3_BUCKET=your-caddy-profile-bucket
# バケットのリージョン（松下会と別バケットでも可）
AWS_S3_REGION=ap-northeast-1
```

### S3バケット

- 非公開バケットで作成
- CORSに `POST`（アップロード）を許可（アプリのOriginを `AllowedOrigins` に追加）
- IAM: アプリ用キーに `s3:PutObject` / `s3:GetObject`（`caddy-profiles/*` などprefix制限推奨）

### API

- `POST /api/caddy-profiles/upload-url` … 写真アップロード用 Presigned POST
- `GET /api/caddy-profiles/photo-url?key=...` … 一覧表示用の署名付き読み取りURL（キーは `caddy-profiles/` で始まるもののみ）

### Firestore セキュリティルール（`caddy_profiles`）

このアプリは **LINE（LIFF）のみ**で、ブラウザから Firestore に書くとき **Firebase Authentication の `request.auth` は通常つきません**（READMEの `users` / `schedules` と同じ前提）。

そのため、**開発・テストと同様に「コレクション単位で許可」**するのが手早いです。

#### 手順

1. [Firebase Console](https://console.firebase.google.com/) → 対象プロジェクト → **Firestore Database** → **ルール** タブ
2. 既存の `match` ブロックに、次の **`caddy_profiles` 用のブロックを追加**する  
   （`users` / `schedules` と並べて書きます）
3. **公開** をクリック（保存だけでは反映されません）

#### 開発・テスト用（`users` / `schedules` と同じ考え方：誰でも読み書き）

既存ルールが下記のような形なら、`caddy_profiles` の `match` を **1つ足します**。

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true;
    }
    match /schedules/{scheduleId} {
      allow read, write: if true;
    }
    match /caddy_profiles/{profileId} {
      allow read, write: if true;
    }
  }
}
```

`mahjong_schedules` や `matsushita_kai_records` など、プロジェクトで既に別コレクションを許可している場合は、**それらはそのまま残した上で** `match /caddy_profiles/{profileId}` だけ追加してください。

#### 本番で締める場合の例（読み取りは全員・書き込みは認証ユーザーのみ）

Firebase Auth を導入して `request.auth.uid` が取れるようになった後なら、例えば次のようにできます（**現状のLIFFのみ構成では `request.auth` が null のため、そのままでは書けません**）。

```text
match /caddy_profiles/{profileId} {
  allow read: if request.auth != null;
  allow create, update, delete: if request.auth != null
    && request.resource.data.posterId == request.auth.uid;
}
```

上記は **設計例**です。LINE の `userId` と Firebase Auth の `uid` を一致させる仕組みが別途必要です。

---

### Firestore インデックス

一覧は `orderBy('createdAt', 'desc')` を使っています。初回アクセスでインデックス作成リンクが出たら、リンクから作成してください。
