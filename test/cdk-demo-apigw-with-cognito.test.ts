import {expect as expectCDK, haveResource} from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkDemoApigwWithCognito from '../lib/cdk-demo-apigw-with-cognito-stack';

test('Test Stack', () => {
  const app = new cdk.App();
  // WHEN
  const domainPrefix = 'test-domain';
  const callbackUrls = ['http://localhost:3200/'];
  const logoutUrls = ['http://localhost:3200/'];
  const frontendUrls = ['http://localhost:3200/'];
  const stack = new CdkDemoApigwWithCognito.CdkDemoApigwWithCognitoStack(
    app,
    'MyTestStack',
    {
      callbackUrls,
      logoutUrls,
      frontendUrls,
      domainPrefix,
    }
  );
  // THEN
  expectCDK(stack).to(
    haveResource('AWS::Cognito::UserPool', {
      // 管理者にしかユーザー作成を許可しない
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: true,
      },
      // メールアドレスのみ必須にする、変更は可能にする
      Schema: [
        {
          Mutable: true,
          Name: 'email',
          Required: true,
        },
        {
          Mutable: true,
          Name: 'phone_number',
          Required: false,
        },
      ],
      // メールアドレスの大文字小文字は区別しない
      UsernameConfiguration: {
        CaseSensitive: false,
      },
    })
  );
  expectCDK(stack).to(
    haveResource('AWS::Cognito::UserPoolDomain', {
      Domain: domainPrefix,
    })
  );
  expectCDK(stack).to(
    haveResource('AWS::Cognito::UserPoolClient', {
      AllowedOAuthFlows: ['code'],
      AllowedOAuthFlowsUserPoolClient: true,
      AllowedOAuthScopes: ['email', 'openid', 'profile'],
      CallbackURLs: callbackUrls,
      LogoutURLs: logoutUrls,
    })
  );
  expectCDK(stack).to(
    haveResource('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs14.x',
    })
  );
  expectCDK(stack).to(
    haveResource('AWS::ApiGatewayV2::Api', {
      CorsConfiguration: {
        AllowHeaders: ['authorization'],
        AllowMethods: ['*'],
        AllowOrigins: frontendUrls,
      },
      ProtocolType: 'HTTP',
    })
  );
  expectCDK(stack).to(
    haveResource('AWS::ApiGatewayV2::Authorizer', {
      AuthorizerType: 'JWT',
      Name: 'CognitoAuthorizer',
      IdentitySource: ['$request.header.Authorization'],
    })
  );
});
