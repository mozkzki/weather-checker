import * as path from "path";
import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdapython from "@aws-cdk/aws-lambda-python";
import { Duration } from "@aws-cdk/core";

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

    const fnFoo = new lambdapython.PythonFunction(this, "fn-weather-checker", {
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
    });
    cdk.Tags.of(fnFoo).add("runtime", "python");
  }
}
