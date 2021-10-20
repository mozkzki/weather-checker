# Selenium in Lambda

**(注): M1 Mac (Appleシリコン) では Docker 周りがだめでcdk deploy等がうまく動かない**

Lambda (Python) 上でSeleniumを動かすサンプル。

- Lambda Layer ２つ
  - アプリの依存ライブラリ用
    - [Selenium](https://github.com/SeleniumHQ/selenium)
    - [Chronyk](https://github.com/KoffeinFlummi/Chronyk)
    - [moz-image](https://github.com/mozkzki/moz-image)
  - Chrome用
    - [serverless-chrome](https://github.com/adieuadieu/serverless-chrome)
    - [chromedriver](https://chromedriver.chromium.org/)
    - [日本語フォント (IPA)](https://moji.or.jp/ipafont/)
- メインコード(`index.py`)をコンソール上で編集可能
- CDK 利用 (CDK のコードは TypeScript)

## 始め方

CDK周りは下記がベースなので最初にそっちを読む。

- [mozkzki/cdk-lambda-sample](https://github.com/mozkzki/cdk-lambda-sample)

## CDK 周り

### Lambda Layer 作成

デプロイする前に必要。

```sh
make layer
```

### デプロイ

スタックをデプロイ。

```sh
cdk deploy
```

### 実行

```sh
aws lambda invoke --function-name weather-checker response.json --log-type Tail --query 'LogResult' --output text | base64 -d
# or
# cdk.jsonがある場所で
make start
```

### テスト

CDKコードのテスト。

```sh
make test
```

### スタック削除

```sh
cdk destroy
```

## Python コード開発

`lambda`ディレクトリ以下で開発する。

```sh
cd lambda
# lint
make lint
# 環境変数設定
cp env_sample.sh env.sh
vi env.sh
source env.sh
# unit test
make ut
```
