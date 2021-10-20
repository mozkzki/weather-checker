import * as path from "path";
import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdapython from "@aws-cdk/aws-lambda-python";

export class CdkWorkshopStackSimpleLambda extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    ////////////////////////////
    // Python lambda
    ////////////////////////////

    const layer = new lambdapython.PythonLayerVersion(
      this,
      "python-lambda-layer",
      {
        layerVersionName: "python-lambda-layer",
        entry: path.resolve(__dirname, "../lambda/layer"),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_7],
      }
    );

    const fnFoo = new lambdapython.PythonFunction(this, "fn-foo", {
      functionName: "foo",
      runtime: lambda.Runtime.PYTHON_3_7,
      entry: path.resolve(__dirname, "../lambda/src/foo"),
      index: "index.py",
      handler: "handler",
      layers: [layer],
    });
    cdk.Tags.of(fnFoo).add("runtime", "python");
  }
}
