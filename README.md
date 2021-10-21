# weather-checker

Yahoo天気をチェックして雨が降りそうならLINE/Slackに通知する。

## 始め方

下記がベースなので最初に読んでください。

- [mozkzki/selenium-in-lambda](https://github.com/mozkzki/selenium-in-lambda)

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
