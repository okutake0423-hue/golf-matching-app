# ゴルフマッチングアプリ

社内ゴルフマッチングアプリの雛形です。LIFF（LINE Front-end Framework）とFirebaseを使用して、LINEログイン機能とプロフィール表示機能を実装しています。

## 技術スタック

- **Next.js 14** - Reactフレームワーク
- **TypeScript** - 型安全性
- **LIFF** - LINE Front-end Framework
- **Firebase** - バックエンドサービス（認証など）

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. LINE Developersでの設定

1. [LINE Developers](https://developers.line.biz/ja/)にアクセスしてログイン
2. 新しいプロバイダーを作成（初回のみ）
3. 新しいチャネルを作成（Messaging APIチャネル）
4. LIFFアプリを作成：
   - 「LIFF」タブを開く
   - 「追加」ボタンをクリック
   - アプリ名を入力
   - サイズ: Full
   - エンドポイントURL: `https://your-domain.com`（開発時は後で設定）
   - スコープ: `profile`, `openid`
5. LIFF IDをコピー

### 3. Firebaseプロジェクトの設定

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. Webアプリを追加（`</>`アイコンをクリック）
4. 設定情報をコピー：
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
5. Authenticationを有効化：
   - 左メニューから「Authentication」を選択
   - 「始める」をクリック
   - **注意**: Firebase Authenticationには標準でLINEプロバイダーが存在しません
   - カスタムトークンを使用してLINE認証を実装します（後述）

#### Firebase Admin SDKの設定（カスタムトークン生成用）

Firebase Admin SDKを使用してカスタムトークンを生成する必要があります：

1. Firebase Consoleで「プロジェクトの設定」→「サービスアカウント」を開く
2. 「新しい秘密鍵の生成」をクリックしてJSONファイルをダウンロード
3. このJSONファイルを`firebase-admin-key.json`としてプロジェクトルートに保存（`.gitignore`に追加済み）
4. または、環境変数として設定（推奨）:
   ```env
   FIREBASE_ADMIN_PROJECT_ID=your_project_id
   FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
   FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
   ```

### 4. 環境変数の設定

`.env.example`を`.env.local`にコピーして、実際の値を設定してください：

```bash
cp .env.example .env.local
```

`.env.local`ファイルを編集：

```env
# LINE LIFF設定
NEXT_PUBLIC_LIFF_ID=your_liff_id_here

# Firebase設定
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認してください。

### 6. LIFFアプリのエンドポイントURL設定

#### 開発環境での設定

開発環境では、`localhost`を使用できます：

1. [LINE Developers Console](https://developers.line.biz/console/)にアクセス
2. 作成したプロバイダーを選択
3. チャネルを選択（Messaging APIチャネル）
4. 「LIFF」タブをクリック
5. 作成したLIFFアプリを選択（または新規作成）
6. 「エンドポイントURL」に以下を設定：
   ```
   http://localhost:3000
   ```
   **注意**: 開発環境では`http://`でも動作しますが、本番環境では`https://`が必須です
7. 「更新」ボタンをクリック

#### 本番環境での設定

アプリを本番環境にデプロイした後、エンドポイントURLを本番のURLに更新します：

1. **デプロイ先の例**:
   - Vercel: `https://your-app-name.vercel.app`
   - Netlify: `https://your-app-name.netlify.app`
   - Firebase Hosting: `https://your-project-id.web.app`
   - 独自ドメイン: `https://your-domain.com`

2. **LINE Developers Consoleでの設定**:
   - [LINE Developers Console](https://developers.line.biz/console/)にアクセス
   - プロバイダー → チャネル → 「LIFF」タブを開く
   - LIFFアプリを選択
   - 「エンドポイントURL」を本番環境のURLに変更：
     ```
     https://your-app-name.vercel.app
     ```
   - 「更新」ボタンをクリック

3. **注意事項**:
   - エンドポイントURLは**必ず`https://`で始まる必要があります**（本番環境）
   - URLの末尾にスラッシュ（`/`）は付けないでください
   - 変更後、LINEアプリ内でLIFFアプリを開き直す必要がある場合があります

#### デプロイ例: Vercelへのデプロイ

##### 方法A: GitHub経由でデプロイ（推奨）

1. **GitHubリポジトリの準備**

   **ステップ1: Gitがインストールされているか確認**
   
   コマンドプロンプト（CMD）またはPowerShellで以下を実行：
   ```cmd
   git --version
   ```
   
   Gitがインストールされていない場合：
   - [Git公式サイト](https://git-scm.com/download/win)からダウンロードしてインストール
   - インストール後、コマンドプロンプトを再起動

   **ステップ2: GitHubアカウントの作成**
   
   - [GitHub](https://github.com/)にアクセス
   - 「Sign up」をクリックしてアカウントを作成
   - メールアドレスの確認を完了

   **ステップ3: GitHubでリポジトリを作成**
   
   1. GitHubにログイン
   2. 右上の「+」ボタン → 「New repository」をクリック
   3. リポジトリ名を入力（例: `golf-matching-app`）
   4. 「Public」または「Private」を選択
   5. 「Initialize this repository with a README」は**チェックを外す**（既にREADMEがあるため）
   6. 「Create repository」をクリック
   7. 作成されたページで、リポジトリのURLをコピー（例: `https://github.com/your-username/golf-matching-app.git`）

   **ステップ4: ローカルでGitリポジトリを初期化**
   
   コマンドプロンプト（CMD）でプロジェクトディレクトリに移動：
   ```cmd
   cd C:\Users\takes\OneDrive\Desktop\TES_PGM\GolfMachingApp
   ```
   
   Gitリポジトリを初期化：
   ```cmd
   git init
   ```
   → `.git`フォルダが作成されます

   **ステップ5: Gitのユーザー情報を設定（初回のみ）**
   
   Gitでコミットするには、ユーザー名とメールアドレスを設定する必要があります。
   
   **グローバル設定（すべてのリポジトリで使用）:**
   ```cmd
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```
   → `Your Name`を自分の名前（例: `Takes`）に置き換えてください
   → `your.email@example.com`を自分のメールアドレス（GitHubに登録したメールアドレス推奨）に置き換えてください
   → 例: `git config --global user.name "Takes"`、`git config --global user.email "takes@example.com"`
   
   **このリポジトリのみに設定する場合:**
   ```cmd
   git config user.name "Your Name"
   git config user.email "your.email@example.com"
   ```
   → `--global`を付けないと、このリポジトリのみに設定されます
   
   **設定の確認:**
   ```cmd
   git config --global user.name
   git config --global user.email
   ```
   → 設定した値が表示されればOKです

   **ステップ6: ファイルをGitに追加**
   
   ```cmd
   git add .
   ```
   → プロジェクト内のすべてのファイルがステージングエリアに追加されます
   → `.gitignore`に記載されているファイル（`node_modules`、`.env.local`など）は除外されます

   **ステップ7: 初回コミットを作成**
   
   ```cmd
   git commit -m "Initial commit"
   ```
   → 変更をローカルのGitリポジトリに保存します
   → `-m "Initial commit"`はコミットメッセージです

   **ステップ8: GitHubリポジトリと接続**
   
   ```cmd
   git remote add origin https://github.com/your-username/golf-matching-app.git
   ```
   → `your-username`を自分のGitHubユーザー名に置き換えてください
   → 例: `https://github.com/takes/golf-matching-app.git`
   → これでローカルのリポジトリとGitHubのリポジトリが接続されます

   **ステップ9: ブランチ名をmainに変更（必要に応じて）**
   
   ```cmd
   git branch -M main
   ```
   → ブランチ名を`main`に変更します（GitHubのデフォルトに合わせるため）

   **ステップ10: GitHubにコードをアップロード**
   
   ```cmd
   git push -u origin main
   ```
   → GitHubにログインを求められたら、GitHubのユーザー名とパスワード（またはPersonal Access Token）を入力
   → 初回のみ`-u`オプションで、今後は`git push`だけでアップロードできるようになります

   **各コマンドの意味:**
   - `git init`: 現在のフォルダをGitリポジトリとして初期化
   - `git add .`: すべてのファイルをGitの管理対象に追加
   - `git commit`: 変更を記録（保存）
   - `git remote add`: リモートリポジトリ（GitHub）のURLを登録
   - `git push`: ローカルの変更をGitHubにアップロード

   **トラブルシューティング:**
   
   - **認証エラーが出る場合**: GitHubのPersonal Access Tokenを使用する必要があります
     1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
     2. 「Generate new token」をクリック
     3. 「repo」にチェックを入れる
     4. トークンを生成してコピー
     5. `git push`時にパスワードの代わりにこのトークンを入力
   
   - **「remote origin already exists」エラー**: 既にリモートが設定されている場合
     ```cmd
     git remote remove origin
     git remote add origin https://github.com/your-username/golf-matching-app.git
     ```

2. **Vercelアカウントの作成**
   - [Vercel](https://vercel.com/)にアクセス
   - 「Sign Up」をクリック
   - GitHubアカウントでサインアップ（推奨）またはメールアドレスで登録

3. **プロジェクトのインポート**
   - Vercelダッシュボードで「Add New...」→「Project」をクリック
   - 「Import Git Repository」でGitHubリポジトリを選択
   - リポジトリが見つからない場合は「Adjust GitHub App Permissions」で権限を設定

4. **プロジェクト設定**
   - **Framework Preset**: Next.js（自動検出されるはず）
   - **Root Directory**: `./`（デフォルト）
   - **Build Command**: `npm run build`（自動設定）
   - **Output Directory**: `.next`（自動設定）
   - **Install Command**: `npm install`（自動設定）

5. **環境変数の設定**
   - 「Environment Variables」セクションを開く
   - `.env.local`の内容を1つずつ追加：
     
     **LINE LIFF設定:**
     - `NEXT_PUBLIC_LIFF_ID` = `your_liff_id_here`
     
     **Firebase設定（クライアントサイド用）:**
     - `NEXT_PUBLIC_FIREBASE_API_KEY` = `your_firebase_api_key`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `your_project_id.firebaseapp.com`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `your_project_id`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = `your_project_id.appspot.com`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = `your_messaging_sender_id`
     - `NEXT_PUBLIC_FIREBASE_APP_ID` = `your_app_id`
     
     **Firebase Admin SDK設定（サーバーサイド用）:**
     - `FIREBASE_ADMIN_PROJECT_ID` = `your_project_id`
     - `FIREBASE_ADMIN_CLIENT_EMAIL` = `your_service_account_email@...`
     - `FIREBASE_ADMIN_PRIVATE_KEY` = `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`
     - **注意**: `FIREBASE_ADMIN_PRIVATE_KEY`は改行文字（`\n`）を含むため、そのまま貼り付けてください
   
   - 各環境変数の「Environment」で「Production」「Preview」「Development」を選択
   - 「Save」をクリック

6. **デプロイの実行**
   - 「Deploy」ボタンをクリック
   - ビルドが完了するまで待機（通常1-3分）
   - 「Congratulations!」画面が表示されたら成功

7. **デプロイURLの確認**
   - デプロイ完了後、以下のようなURLが表示されます：
     ```
     https://golf-matching-app-xxxxx.vercel.app
     ```
   - このURLをコピー

8. **LINE Developers ConsoleでエンドポイントURLを更新**
   - [LINE Developers Console](https://developers.line.biz/console/)にアクセス
   - プロバイダー → チャネル → 「LIFF」タブ
   - LIFFアプリを選択
   - 「エンドポイントURL」をVercelのURLに変更：
     ```
     https://golf-matching-app-xxxxx.vercel.app
     ```
   - 「更新」ボタンをクリック

##### 方法B: Vercel CLIでデプロイ

1. **Vercel CLIのインストール**
   ```bash
   npm install -g vercel
   ```

2. **Vercelにログイン**
   ```bash
   vercel login
   ```
   - ブラウザが開くので、Vercelアカウントでログイン

3. **プロジェクトディレクトリでデプロイ**
   ```bash
   cd C:\Users\takes\OneDrive\Desktop\TES_PGM\GolfMachingApp
   vercel
   ```
   
4. **対話形式の設定**
   - 「Set up and deploy?」→ `Y`
   - 「Which scope?」→ アカウントを選択
   - 「Link to existing project?」→ `N`（新規プロジェクトの場合）
   - 「What's your project's name?」→ `golf-matching-app`（任意）
   - 「In which directory is your code located?」→ `./`（Enter）
   - 「Want to override the settings?」→ `N`

5. **環境変数の設定**
   ```bash
   vercel env add NEXT_PUBLIC_LIFF_ID
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   # ... 他の環境変数も同様に追加
   ```
   
   または、Vercelダッシュボードで環境変数を設定（方法Aの手順5を参照）

6. **本番環境へのデプロイ**
   ```bash
   vercel --prod
   ```

7. **デプロイURLの確認とLINE Developers Consoleの更新**
   - デプロイ完了後、表示されたURLをコピー
   - LINE Developers ConsoleでエンドポイントURLを更新（方法Aの手順8を参照）

##### デプロイ後の確認

1. **アプリの動作確認**
   - VercelのURLにブラウザでアクセス
   - アプリが正常に表示されるか確認

2. **LINEアプリ内での確認**
   - LINEアプリを開く
   - LIFFアプリを起動（LINE内のリンクやボタンから）
   - ログイン機能が正常に動作するか確認

##### トラブルシューティング

- **環境変数が読み込まれない**: Vercelダッシュボードで環境変数が正しく設定されているか確認
- **ビルドエラー**: Vercelのビルドログを確認し、エラーメッセージを参照
- **Firebase Admin SDKエラー**: `FIREBASE_ADMIN_PRIVATE_KEY`の改行文字（`\n`）が正しく設定されているか確認

## プロジェクト構造

```
.
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   └── auth/
│   │       └── line/
│   │           └── route.ts  # LINE認証API（カスタムトークン生成）
│   ├── layout.tsx            # ルートレイアウト
│   ├── page.tsx              # ホームページ（プロフィール表示）
│   ├── page.module.css       # ページスタイル
│   └── globals.css           # グローバルスタイル
├── lib/                      # ユーティリティ関数
│   ├── firebase.ts           # Firebase設定（クライアントサイド）
│   ├── firebase-auth.ts      # Firebase認証ヘルパー関数
│   └── liff.ts               # LIFF設定と関数
├── .env.example              # 環境変数のテンプレート
├── FIREBASE_SETUP.md         # Firebase設定ガイド
├── next.config.js            # Next.js設定
├── package.json              # 依存関係
├── tsconfig.json             # TypeScript設定
└── README.md                 # このファイル
```

## 機能

- ✅ LINEログイン機能
- ✅ ユーザープロフィール表示（表示名、ユーザーID、プロフィール画像、ステータスメッセージ）
- ✅ ログアウト機能

## 次のステップ

- Firebase Authenticationとの連携（LIFFのIDトークンをFirebaseで検証）
- ユーザーデータのFirestoreへの保存
- ゴルフマッチング機能の実装

## FirebaseとLINE認証の連携について

Firebase Authenticationには標準でLINEプロバイダーが存在しないため、以下の方法で連携します：

1. **LIFFでLINEログイン**: ユーザーがLIFF経由でLINEにログイン
2. **IDトークン取得**: LIFFからIDトークンを取得
3. **カスタムトークン生成**: サーバーサイド（API Route）でLIFFのIDトークンを検証し、Firebaseのカスタムトークンを生成
4. **Firebase認証**: カスタムトークンを使ってFirebaseにログイン

### Firebase Admin SDKの実装

`app/api/auth/line/route.ts`を更新して、Firebase Admin SDKを使用してください：

```typescript
import admin from 'firebase-admin';

// Firebase Admin SDKの初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// カスタムトークンの生成
const customToken = await admin.auth().createCustomToken(lineProfile.sub);
```

または、サービスアカウントJSONファイルを使用する場合：

```typescript
import admin from 'firebase-admin';
import serviceAccount from '@/firebase-admin-key.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}
```

## 注意事項

- `.env.local`ファイルはGitにコミットしないでください（`.gitignore`に含まれています）
- `firebase-admin-key.json`もGitにコミットしないでください
- LIFFアプリはHTTPS環境で動作する必要があります（開発環境では`localhost`も使用可能）
- Firebase Admin SDKはサーバーサイドでのみ動作します（クライアントサイドでは使用できません）

## トラブルシューティング

### LIFFの初期化に失敗する場合

- `NEXT_PUBLIC_LIFF_ID`が正しく設定されているか確認
- LIFFアプリがLINE Developersで正しく作成されているか確認
- ブラウザのコンソールでエラーメッセージを確認

### Firebase接続エラーが発生する場合

- Firebase設定値が正しく設定されているか確認
- FirebaseプロジェクトでAuthenticationが有効化されているか確認
- ネットワーク接続を確認
