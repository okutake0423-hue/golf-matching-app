# ビルドエラーのトラブルシューティング

## ビルドエラーの確認方法

### Vercelダッシュボードでエラーを確認

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. プロジェクトを選択
3. 「Deployments」タブを開く
4. 失敗したデプロイメントをクリック
5. 「Build Logs」を確認してエラーメッセージを確認

### よくあるビルドエラーと解決方法

#### 1. 環境変数が設定されていない

**エラーメッセージ例:**
```
Error: NEXT_PUBLIC_LIFF_ID is not defined
```

**解決方法:**
- Vercelダッシュボード → プロジェクト → Settings → Environment Variables
- 必要な環境変数をすべて追加
- 環境変数の名前が正しいか確認（大文字小文字を含む）

#### 2. TypeScriptの型エラー

**エラーメッセージ例:**
```
Type error: Property 'xxx' does not exist on type 'yyy'
```

**解決方法:**
- ローカルで`npm run build`を実行してエラーを確認
- 型定義を修正
- `tsconfig.json`の設定を確認

#### 3. Firebase Admin SDKのエラー

**エラーメッセージ例:**
```
Cannot find module 'firebase-admin'
```

**解決方法:**
- `package.json`に`firebase-admin`が含まれているか確認
- `npm install`が正常に完了しているか確認

#### 4. モジュールが見つからない

**エラーメッセージ例:**
```
Module not found: Can't resolve '@/xxx'
```

**解決方法:**
- `tsconfig.json`の`paths`設定を確認
- ファイルパスが正しいか確認
- インポート文のパスを確認

## ローカルでビルドをテストする

デプロイ前にローカルでビルドをテスト：

```cmd
cd C:\Users\takes\OneDrive\Desktop\TES_PGM\GolfMachingApp
npm run build
```

エラーが表示されたら、それを修正してから再度デプロイしてください。

## 環境変数の確認リスト

Vercelで以下の環境変数が設定されているか確認：

- [ ] `NEXT_PUBLIC_LIFF_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `FIREBASE_ADMIN_PROJECT_ID`
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL`
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY`

## 次のステップ

1. Vercelのビルドログでエラーメッセージを確認
2. エラーメッセージに基づいて修正
3. ローカルで`npm run build`を実行して確認
4. 修正をGitHubにプッシュ
5. Vercelが自動的に再デプロイ
