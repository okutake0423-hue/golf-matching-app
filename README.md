# ゴルフマッチングアプリ

社内向けのゴルフマッチングアプリです。LINEログイン（LIFF）と Firebase（Firestore）で、ユーザー認証とプロフィールの管理を行います。

---

## 技術スタック

| 項目 | 技術 |
|------|------|
| フロントエンド | Next.js 14（App Router）, React 18, TypeScript |
| 認証・フロント | LIFF（LINE Front-end Framework） |
| バックエンド | Firebase（Authentication, Firestore） |
| デプロイ | Vercel 想定 |

---

## 機能一覧

- **LINEログイン** … LIFF によるログイン・ログアウト
- **プロフィール表示** … LINE の表示名・アイコンに加え、アプリ独自項目（会社名・平均スコア・プレイスタイル）を表示
- **プロフィール編集** … 上記独自項目の入力・保存（Firestore の `users` コレクションに `userId` をドキュメントIDとして保存）
- **Firebase 連携** … LIFF の ID トークン検証後、カスタムトークンで Firebase 認証（API Route で実装）

---

## プロジェクト構造

```
GolfMachingApp/
├── app/
│   ├── api/auth/line/     # LINE IDトークン → Firebase カスタムトークン API
│   ├── profile/edit/      # プロフィール編集ページ
│   ├── layout.tsx
│   ├── page.tsx           # トップ（ログイン / プロフィール表示）
│   └── globals.css
├── components/
│   ├── ProfileDisplay.tsx     # プロフィール表示
│   └── ProfileEditForm.tsx   # プロフィール編集フォーム
├── lib/
│   ├── firebase.ts        # Firebase 初期化（Auth, Firestore）
│   ├── firestore.ts       # Firestore 取得・保存（users）
│   ├── liff.ts            # LIFF 初期化・ログイン・プロフィール取得
│   └── firebase-auth.ts   # Firebase 認証ヘルパー
├── types/
│   └── profile.ts         # プロフィール・フォームの型定義
├── .env.example           # 環境変数の例
├── FIREBASE_SETUP.md      # Firebase 詳細設定
├── BUILD_TROUBLESHOOTING.md  # ビルド時のトラブルシューティング
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

`.env.example` をコピーして `.env.local` を作成し、値を設定します。

```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local
```

| 変数名 | 説明 | 取得元 |
|--------|------|--------|
| `NEXT_PUBLIC_LIFF_ID` | LIFF アプリの ID | LINE Developers Console → チャネル → LIFF |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase クライアント用（6種類） | Firebase Console → プロジェクトの設定 → 全般 |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase プロジェクト ID | 上記と同じ |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | サービスアカウントのメール | Firebase → プロジェクトの設定 → サービスアカウント → 秘密鍵 JSON の `client_email` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | 秘密鍵（改行は `\n`、全体を `"` で囲む） | 上記 JSON の `private_key` |

### 3. LINE Developers（LIFF）

1. [LINE Developers Console](https://developers.line.biz/console/) でプロバイダー・チャネル（Messaging API）を作成
2. チャネルの **LIFF** タブで LIFF アプリを追加
   - サイズ: Full
   - スコープ: `profile`, `openid`
   - エンドポイント URL: 開発時は `http://localhost:3000`、本番は Vercel の URL
3. 発行された **LIFF ID** を `NEXT_PUBLIC_LIFF_ID` に設定

### 4. Firebase

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. **Authentication** を有効化（LINE は標準にないため、本アプリでは LIFF の ID トークン → カスタムトークンで連携）
3. **Firestore Database** の有効化（手順は下記「Firestore の有効化手順」を参照）
4. **Web アプリ** を追加し、表示される設定値を `NEXT_PUBLIC_FIREBASE_*` に設定
5. カスタムトークン発行用に **サービスアカウント** の秘密鍵を取得し、`FIREBASE_ADMIN_*` を設定

詳細は **FIREBASE_SETUP.md** を参照してください。

---

## Firestore の有効化手順

### 1. Firebase Console を開く

1. [Firebase Console](https://console.firebase.google.com/) にログイン
2. 対象のプロジェクトをクリック（まだの場合は「プロジェクトを追加」で作成）

### 2. Firestore データベースを作成

1. 左メニューで **「Firestore Database」** をクリック
2. **「データベースを作成」** をクリック
3. **セキュリティルールのモード** を選ぶ
   - **本番モード** … 最初は全アクセス拒否。後からルールを書いて許可する（本番向け）
   - **テストモード** … 約30日間は読み書き許可。開発中の動作確認向け
4. **ロケーション**（リージョン）を選択  
   例: `asia-northeast1`（東京）。一度選ぶと変更できないので注意
5. **「有効にする」** をクリック
6. 作成が終わると、空の Firestore が表示される

### 3. ルールを設定する

1. Firestore の画面で **「ルール」** タブを開く
2. 次のいずれかを貼り付けて **「公開」** をクリック

**開発・テスト用（誰でも読み書き可能）:**

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true;
    }
  }
}
```

**本番向け（認証済みユーザーが自分のドキュメントのみ）:**

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

※ 本アプリでは LINE ログインのみのため、クライアントから直接 Firestore に書く場合は「開発用」ルールか、別途 Cloud Functions 等で認証を挟む運用を検討してください。

### 4. 動作確認

- アプリで LINE ログイン → プロフィール編集で「保存」すると、Firestore の **「データ」** タブに `users` コレクションができ、ドキュメントが追加されます。

---

## 開発・ビルド・デプロイ

### 開発サーバー

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。`.env.local` を変更した場合は、サーバーを再起動してください。

### ビルド・本番起動

```bash
npm run build
npm run start
```

### デプロイ（Vercel）— 修正したプログラムのデプロイ手順

修正したプログラムを本番に反映する手順です。

---

#### ステップ1: ローカルでコミットして GitHub にプッシュ

1. プロジェクトフォルダでコマンドプロンプト（または PowerShell）を開く
2. 変更をコミットしてプッシュする

```cmd
cd C:\Users\takes\OneDrive\Desktop\TES_PGM\GolfMachingApp

git add .
git status
git commit -m "プロフィール編集・Firestore連携など修正"
git push origin main
```

- ブランチ名が `main` でない場合は `git push origin ブランチ名` に読み替える
- 初回のみ `git remote add origin https://github.com/ユーザー名/リポジトリ名.git` が必要な場合あり

---

#### ステップ2: Vercel でデプロイ（初回のみ：プロジェクト作成）

1. [Vercel](https://vercel.com/) にログイン
2. **Add New…** → **Project**
3. **Import Git Repository** で GitHub のリポジトリを選択
4. **Root Directory** はそのまま（`./`）
5. **Environment Variables** で以下を追加（Key / Value を入力して **Add**）
   - `NEXT_PUBLIC_LIFF_ID`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
6. **Deploy** をクリック

---

#### ステップ2': すでに Vercel プロジェクトがある場合（修正の再デプロイ）

- **Git と連携している場合**  
  `git push origin main` すると、Vercel が自動で新しいデプロイを開始します。  
  Vercel ダッシュボードの **Deployments** で進行状況を確認できます。

- **手動で再デプロイする場合**
  1. Vercel ダッシュボードで対象プロジェクトを開く
  2. **Deployments** タブを開く
  3. 一番上のデプロイの **⋯**（3点メニュー）→ **Redeploy** をクリック
  4. **Redeploy** で確定

- **環境変数を変えた場合**  
  **Settings** → **Environment Variables** で編集・追加したあと、上記の **Redeploy** を実行すると反映されます。

---

#### ステップ3: デプロイ完了後の確認

1. Vercel の **Deployments** で **Ready** になっていることを確認
2. 表示された URL（例: `https://golf-matching-app-xxx.vercel.app`）でアプリを開く
3. LINE ログイン → プロフィール表示・編集ができるか確認

---

#### ステップ4: LIFF のエンドポイント URL を本番 URL に合わせる

1. [LINE Developers Console](https://developers.line.biz/console/) にログイン
2. 対象チャネル → **LIFF** タブ → 使用する LIFF アプリを選択
3. **エンドポイント URL** を Vercel の URL に変更  
   例: `https://golf-matching-app-xxx.vercel.app`（末尾の `/` は付けない）
4. **更新** をクリック

---

#### まとめ（修正後のデプロイの流れ）

| 状況 | やること |
|------|----------|
| コードを直した | `git add .` → `git commit -m "..."` → `git push origin main`（Vercel が自動デプロイ） |
| 環境変数を変えた | Vercel の **Settings → Environment Variables** で編集 → **Deployments** から **Redeploy** |
| 初めてデプロイする | 上記ステップ2の「初回のみ」の手順で Vercel プロジェクトを作成 |

ビルドエラーが出る場合は **BUILD_TROUBLESHOOTING.md** を参照してください。

---

## 主な画面とデータの流れ

1. **トップ（`/`）**  
   - 未ログイン: 「LINEでログイン」ボタン  
   - ログイン後: LINE プロフィール ＋ Firestore の会社名・平均スコア・プレイスタイルを表示。「編集」で `/profile/edit` へ
2. **プロフィール編集（`/profile/edit`）**  
   - 会社名・平均スコア・プレイスタイルを入力して「保存」  
   - Firestore の `users` コレクションに、ドキュメント ID = LINE の `userId` で保存・更新

---

## 注意事項

- `.env.local` および `firebase-admin-key.json` は Git にコミットしないでください（`.gitignore` に含まれています）
- 本番の Firestore ルールは、認証済みユーザーのみ読み書きできるようにすることを推奨します
- LIFF のエンドポイント URL は本番環境では `https://` が必須です

---

## 関連ドキュメント

- **FIREBASE_SETUP.md** … Firebase / サービスアカウントの詳細設定
- **BUILD_TROUBLESHOOTING.md** … `npm run build` や Vercel ビルドでよくあるエラーと対処

---

## ライセンス

プライベート利用を想定しています。
