#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { CdkWorkshopStackSimpleLambda } from "../lib/cdk-workshop-stack-simple-lambda";

const app = new cdk.App();

new CdkWorkshopStackSimpleLambda(
  app,
  "CdkWorkshopStackSimpleLambda"
);
