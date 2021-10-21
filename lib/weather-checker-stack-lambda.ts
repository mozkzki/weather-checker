import * as path from "path";
import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdapython from "@aws-cdk/aws-lambda-python";
import { Duration } from "@aws-cdk/core";
import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";

export class WeatherCheckerStackLambda extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    ////////////////////////////
    // Python lambda
    ////////////////////////////

    // chrome(headless)を載せたlayer
    const layerForChrome = new lambdapython.PythonLayerVersion(
      this,
      "python-lambda-layer-for-chrome",
      {
        layerVersionName: "python-lambda-layer-for-chrome",
        entry: path.resolve(__dirname, "../lambda/layer/chrome"),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_7],
      }
    );

    // アプリケーションが依存するライブラリを載せたlayer
    const layerForApp = new lambdapython.PythonLayerVersion(
      this,
      "python-lambda-layer-for-app",
      {
        layerVersionName: "python-lambda-layer-for-app",
        entry: path.resolve(__dirname, "../lambda/layer/app"),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_7],
      }
    );

    const weatherCheckerFunction = new lambdapython.PythonFunction(
      this,
      "fn-weather-checker",
      {
        functionName: "weather-checker",
        runtime: lambda.Runtime.PYTHON_3_7,
        entry: path.resolve(__dirname, "../lambda/src/weather_checker"),
        index: "index.py",
        handler: "handler",
        layers: [layerForApp, layerForChrome],
        timeout: Duration.seconds(300),
        memorySize: 512,
        environment: {
          CHROME_BINARY_LOCATION: "/opt/python/headless-chromium",
          CHROME_DRIVER_LOCATION: "/opt/python/chromedriver",
          HOME: "/opt/python/",
          ///////////////////////////////////////////////////////////////////////////
          // 注意: 下記の環境変数についてはAWSコンソールにて正式な値をセットすること
          ///////////////////////////////////////////////////////////////////////////
          // for moz-image
          gyazo_access_token: "dummy",
          // for post LINE and Slack
          SLACK_POST_URL: "dummy",
          SLACK_POST_CHANNEL: "dummy",
          LINE_POST_URL: "dummy",
        },
      }
    );
    cdk.Tags.of(weatherCheckerFunction).add("runtime", "python");

    ////////////////////////////
    // EventBridge
    ////////////////////////////

    // EventBridge のルール
    new events.Rule(this, "rule-weather-checker", {
      // JST で毎日 AM7:30 に定期実行
      // see https://docs.aws.amazon.com/ja_jp/AmazonCloudWatch/latest/events/ScheduledEvents.html#CronExpressions
      schedule: events.Schedule.cron({ minute: "30", hour: "22", day: "?" }),
      targets: [
        new targets.LambdaFunction(weatherCheckerFunction, {
          retryAttempts: 3,
        }),
      ],
    });
  }
}
