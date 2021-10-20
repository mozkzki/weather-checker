import { expect as expectCDK, haveResource } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as CdkWorkshop from "../lib/cdk-workshop-stack-simple-lambda";

test("Lambda Function Created", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new CdkWorkshop.CdkWorkshopStackSimpleLambda(
    app,
    "MyTestStack"
  );
  // THEN
  expectCDK(stack).to(haveResource("AWS::Lambda::Function"));
});
