#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {CdkDemoApigwWithCognitoStack} from '../lib/cdk-demo-apigw-with-cognito-stack';

const app = new cdk.App();
new CdkDemoApigwWithCognitoStack(app, 'CdkDemoApigwWithCognitoStack', {
  callbackUrls: ['http://localhost:3200/oauth2-redirect.html'],
  logoutUrls: ['http://localhost:3200/oauth2-redirect.html'],
  frontendUrls: ['http://localhost:3200'],
  domainPrefix: process.env.DOMAIN_PREFIX!,
});
