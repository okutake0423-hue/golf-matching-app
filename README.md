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
- **ゴルフ予定** … 募集モード（日時・コース・プレーフィー・募集人数）と希望モード（希望日・コース/地域・上限プレーフィー）の投稿、カレンダー表示、月別・日別一覧（Firestore の `schedules` コレクション）
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
    match /schedules/{scheduleId} {
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

### 4. 予定（schedules）用の複合インデックス

月別で予定を取得するクエリを使う場合、Firestore がインデックス作成を要求します。

**エラーが出た場合の対処**:

1. **エラーメッセージのリンクから作成（最も簡単）**:
   - ブラウザのコンソール（F12 → Console）に表示されているエラーメッセージに、`https://console.firebase.google.com/v1/r/project/...` というリンクが含まれています
   - そのリンクをクリックすると、Firebase Console のインデックス作成画面が開きます
   - **「インデックスを作成」** ボタンをクリック
   - インデックスの作成が完了するまで数分かかります（完了するとメールが届く場合があります）

2. **手動で作成する場合**:
   - [Firebase Console](https://console.firebase.google.com/) → 対象プロジェクト → **Firestore Database**
   - **「インデックス」** タブを開く
   - **「複合インデックスを追加」** をクリック
   - 以下を設定:
     - **コレクション ID**: `schedules`
     - **フィールド**: 
       - `monthKey`（昇順）
       - `dateStr`（昇順）
       - `createdAt`（昇順）
   - **「作成」** をクリック
   - インデックスの作成が完了するまで数分かかります

**重要**: インデックスの作成が完了するまで、予定の取得がエラーになります。作成が完了したら、アプリをリロードして再試行してください。

### 5. 動作確認

- アプリで LINE ログイン → プロフィール編集で「保存」すると、Firestore の **「データ」** タブに `users` コレクションができ、ドキュメントが追加されます。
- **予定**（`/schedules`）で「募集する」「希望を出す」から投稿すると、`schedules` コレクションにドキュメントが追加されます。

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

## 修正が反映されないときの確認手順

修正したプログラムが本番（Vercel）やローカルに反映されない場合は、次を順に確認してください。

### 1. ローカルで修正が保存されているか

- 該当ファイルを開き、変更が保存されているか確認（未保存の場合は Ctrl+S）
- 開発サーバーを再起動: ターミナルで `Ctrl+C` → `npm run dev`

### 2. Git にコミット・プッシュしているか

```cmd
cd C:\Users\takes\OneDrive\Desktop\TES_PGM\GolfMachingApp

git status
```

- **Changes not staged** や **Untracked files** が出る → まだコミットしていない

```cmd
git add .
git commit -m "修正内容の説明"
git push origin main
```

- `git push` でエラーになる場合は、リモートのブランチ名（`main` か `master` か）を確認して `git push origin ブランチ名` を実行

### 3. Vercel でデプロイが成功しているか

1. [Vercel ダッシュボード](https://vercel.com/dashboard) で対象プロジェクトを開く
2. **Deployments** タブを開く
3. 一番上のデプロイの **Status** が **Ready**（緑）か確認
   - **Building** のまま止まっている / **Error** になっている → そのデプロイをクリックして **Build Logs** でエラー内容を確認
4. **Ready** のデプロイの **Commit** が、今プッシュしたコミット（メッセージやハッシュ）と一致しているか確認  
   - 古いコミットのまま → 最新の `git push` が Vercel に届いていない、または別ブランチがデプロイされている可能性あり

### 4. ブラウザのキャッシュ

- **ハードリロード**: `Ctrl + Shift + R`（Windows）または `Cmd + Shift + R`（Mac）
- または **シークレットウィンドウ**（プライベートブラウジング）で同じ URL を開いて表示を確認

### 5. 開いている URL が正しいか

- Vercel の **Domains** や **Deployments** に表示されている **本番 URL** を開いているか確認
- プレビュー用の URL と本番 URL が違う場合があるので、本番用の URL で開き直す

### 6. LIFF から開いている場合

- LINE Developers の LIFF の **エンドポイント URL** が、反映させたい Vercel の URL と一致しているか確認
- 一致していないと、古いデプロイや別の URL が開かれることがあります

### 7. 環境変数を変えた場合

- 環境変数を変更したあとは、**Redeploy** しないと反映されません  
  **Deployments** → 最新の **⋯** → **Redeploy** を実行

---

## 主な画面とデータの流れ

1. **トップ（`/`）**  
   - 未ログイン: 「LINEでログイン」ボタン  
   - ログイン後: LINE プロフィール ＋ Firestore の会社名・平均スコア・プレイスタイルを表示。「編集」で `/profile/edit` へ、「予定を見る」で `/schedules` へ
2. **プロフィール編集（`/profile/edit`）**  
   - 会社名・平均スコア・プレイスタイルを入力して「保存」  
   - Firestore の `users` コレクションに、ドキュメント ID = LINE の `userId` で保存・更新
3. **ゴルフ予定（`/schedules`）**  
   - カレンダーで月・日を選択し、予定がある日にドット表示  
   - 「募集する」: 日時・コース・プレーフィー・募集人数・参加者を投稿（種類 `RECRUIT`）  
   - 「希望を出す」: 希望日・希望コース/地域・上限プレーフィーを投稿（種類 `WISH`）  
   - Firestore の `schedules` コレクションに保存

---

## よくあるエラー（Vercel）

### `Firebase: Error (auth/invalid-api-key)`

**原因**: Vercel に Firebase 用の環境変数が入っていないか、値が間違っています。

**対処**:

1. Vercel ダッシュボード → 対象プロジェクト → **Settings** → **Environment Variables**
2. 次の変数が **すべて** 設定されているか確認（Production / Preview にチェック）:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
3. 値は Firebase Console → **プロジェクトの設定** → **全般** → **マイアプリ** の `firebaseConfig` からコピー（余分なスペースや改行を入れない）
4. **保存** したあと、**Deployments** → 最新の **⋯** → **Redeploy** を実行（環境変数を変えただけでは反映されません）

---

### `Content Security Policy ... blocks the use of 'eval'` または `Loading the script 'https://static.line-scdn.net/...' violates CSP`

**原因**: Content Security Policy (CSP) が、Next.js / react-calendar / Firebase の `eval` や、LIFF SDK が読み込む LINE の CDN スクリプトをブロックしています。

**対処**:

1. **ブラウザで実際の CSP ヘッダーを確認（最も確実な方法）**:
   
   以下の手順で、実際に送信されている CSP ヘッダーを確認できます：
   
   **手順**:
   1. アプリの URL を開く（例: `https://your-app.vercel.app`）
   2. **F12キー**を押して開発者ツールを開く
   3. 上部のタブから **Network**（ネットワーク）をクリック
   4. ページをリロード（**F5キー**または**Ctrl+R**）
   5. Network タブの一覧で、一番上のリクエスト（通常は `/` やページ名）をクリック
   6. 右側に詳細が表示されるので、**Headers**（ヘッダー）タブをクリック
   7. 下にスクロールして **Response Headers**（レスポンスヘッダー）セクションを探す
   8. `Content-Security-Policy` という項目を探す
   9. その値を確認:
      - ✅ **正しい場合**: `https://static.line-scdn.net` が含まれている
        ```
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.line-scdn.net https://*.line-scdn.net
        ```
      - ❌ **問題がある場合**: LINE の CDN が含まれていない
        ```
        script-src 'self' 'unsafe-eval' 'unsafe-inline'
        ```
   
   **見つからない場合**: `Content-Security-Policy` という項目自体がない場合は、CSP が設定されていない可能性があります（`next.config.js` の設定が反映されていない可能性）

2. **変更をデプロイ**: `next.config.js` で CSP ヘッダーを設定しており、以下を許可しています：
   - `script-src` と `script-src-elem` に `'unsafe-eval'` と `https://static.line-scdn.net`（LIFF SDK 用）
   - `connect-src` に LINE の API ドメイン
   - **重要**: 変更をコミット・プッシュして、**Vercel でデプロイが完了**しているか確認してください

3. **デプロイの確認**: 
   - `next.config.js` の変更をコミット・プッシュしたか確認
   - [Vercel ダッシュボード](https://vercel.com/dashboard) → プロジェクト → **Deployments** タブ
   - 最新のデプロイが **Ready**（緑）になっているか確認
   - まだ **Building** の場合は完了を待つ

4. **キャッシュクリア**: ブラウザのハードリロード（`Ctrl+Shift+R`）やシークレットウィンドウで再試行してください

5. **LINE アプリ内ブラウザ（LIFF）でまだ出る場合**: LINE 側の CSP が優先されている可能性があります。一度 **LINE 外のブラウザ**（Chrome や Safari でアプリの URL を直接開く）で「予定を見る」を試し、そちらではエラーが出ないか確認してください。LINE 内では CSP の制限をこちらから変更できないため、改善しない場合はカレンダーを別実装に差し替える必要があります。

---

### ログイン画面が出ない・「初期化に失敗しました」と表示される

**原因**: LIFF の初期化に失敗しています。主に次の2点です。

**1. Vercel に `NEXT_PUBLIC_LIFF_ID` が入っていない**

- Vercel → 対象プロジェクト → **Settings** → **Environment Variables**
- **Key**: `NEXT_PUBLIC_LIFF_ID`
- **Value**: LINE Developers Console の LIFF で表示されている **LIFF ID**（数字のみの文字列）
- **Save** 後、**Deployments** → **⋯** → **Redeploy** を実行（必須）

**2. LINE Developers の LIFF「エンドポイントURL」が本番URLと違う**

- [LINE Developers Console](https://developers.line.biz/console/) → チャネル → **LIFF** タブ
- 使用している LIFF を選択
- **エンドポイントURL** を、Vercel の本番URLに合わせる  
  例: `https://あなたのプロジェクト名.vercel.app`  
  （`http://localhost:3000` のままにしていると、本番で開いたときに初期化に失敗します）
- **更新** をクリック

**3. 「Failed to fetch」と出る場合**

LIFF が LINE のサーバーに接続できていません。次を確認してください。

- **LINE から開く**: 必ず **LINE アプリ内**で、LIFF のリンク（「LIFF を開く」など）から開いてください。Chrome などで URL を直接入力して開くと失敗します。
- **エンドポイント URL の一致**: 今開いているアドレスバーの URL と、LINE Developers Console の LIFF の「エンドポイント URL」が **完全に一致**しているか確認してください。
  - 一致させる例: 開いているのが `https://myapp.vercel.app` なら、エンドポイント URL も `https://myapp.vercel.app`（`https://` で始め、末尾に `/` を付けない）
- **HTTPS**: 本番では必ず `https://` の URL を設定してください。
- **ネットワーク**: Wi‑Fi やモバイル回線が有効か、社内ネットワークやファイアウォールで LINE のドメイン（`liff.line.me` など）がブロックされていないか確認してください。

画面上に表示されるメッセージ（「NEXT_PUBLIC_LIFF_ID が…」「エンドポイントURL が…」など）に従って上記を確認してください。

---

### `Missing or insufficient permissions`（Firestore）

**原因**: Firestore のセキュリティルールで、読み書きが拒否されています。このアプリは LINE ログインのみで、Firebase Auth にログインしていないため、`request.auth != null` のルールだと常に拒否されます。

**対処**:

1. [Firebase Console](https://console.firebase.google.com/) → 対象プロジェクト → **Firestore Database**
2. **「ルール」** タブを開く
3. 次のルールに書き換え、**「公開」** をクリック

**開発・テスト用（誰でも読み書き可能）:**

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
  }
}
```

これで `users` と `schedules` コレクションへの読み書きが許可され、プロフィールの表示・保存と予定の投稿・表示が動きます。

**重要**: 
- このルールは開発・テスト用です。本番環境では、Cloud Functions などサーバー側で Firestore を操作する構成に変更することを推奨します
- ルールを変更した後、必ず **「公開」** ボタンをクリックしてください（保存だけでは反映されません）

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
