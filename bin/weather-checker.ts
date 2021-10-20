#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { WeatherCheckerStackLambda } from "../lib/weather-checker-stack-lambda";

const app = new cdk.App();

new WeatherCheckerStackLambda(app, "WeatherCheckerStackLambda");
