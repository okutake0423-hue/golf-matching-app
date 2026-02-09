# CSP デバッグ手順

## 問題
`Loading the script 'https://static.line-scdn.net/...' violates CSP` エラーが発生している

## 確認手順

### 1. デプロイの確認
- [ ] `next.config.js` の変更をコミット・プッシュしたか
- [ ] Vercel の Deployments タブで最新のデプロイが **Ready**（緑）になっているか
- [ ] デプロイの Build Logs にエラーがないか

### 2. CSP ヘッダーの確認
ブラウザの開発者ツール（F12）で以下を確認：

1. **Network** タブを開く
2. ページをリロード（F5）
3. 最初の HTML リクエスト（通常は `/` やページ名）を選択
4. **Headers** タブ → **Response Headers** を開く
5. `Content-Security-Policy` を確認

**期待される値**:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.line-scdn.net https://*.line-scdn.net; script-src-elem 'self' 'unsafe-inline' https://static.line-scdn.net https://*.line-scdn.net; ...
```

**実際の値**（エラーが出ている場合）:
```
Content-Security-Policy: script-src 'self' 'unsafe-eval' 'unsafe-inline'
```

### 3. Vercel の設定確認
Vercel ダッシュボードで以下を確認：

1. **Settings** → **Security** を開く
2. **Content Security Policy** が設定されていないか確認
   - 設定されている場合、それを削除するか、LINE の CDN を追加
3. **Headers** タブで CSP が設定されていないか確認

### 4. ローカルでの確認
```bash
npm run build
npm run start
```

ブラウザで `http://localhost:3000` を開き、開発者ツールで CSP ヘッダーを確認

### 5. キャッシュのクリア
- ブラウザのハードリロード（`Ctrl+Shift+R`）
- シークレットウィンドウで開き直す
- Vercel のデプロイを再実行（Redeploy）

## 解決方法

### 方法1: Vercel の設定を確認
Vercel の Settings → Security で CSP が設定されている場合、それを削除するか、LINE の CDN を追加してください。

### 方法2: vercel.json の確認
プロジェクトルートに `vercel.json` がある場合、そこでも CSP が設定されていないか確認してください。

### 方法3: 一時的に CSP を無効化してテスト
`next.config.js` の CSP 設定を一時的にコメントアウトして、エラーが消えるか確認してください。
