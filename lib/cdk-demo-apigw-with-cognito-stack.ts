import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import * as apigw from '@aws-cdk/aws-apigatewayv2';
import {HttpMethod} from '@aws-cdk/aws-apigatewayv2/lib/http/route';
import * as intg from '@aws-cdk/aws-apigatewayv2-integrations';
import * as nodejs from '@aws-cdk/aws-lambda-nodejs';
import * as authz from '@aws-cdk/aws-apigatewayv2-authorizers';

export interface CdkDemoApigwWithCognitoStackProps extends cdk.StackProps {
  callbackUrls: string[];
  logoutUrls: string[];
  frontendUrls: string[];
  domainPrefix: string;
}

export class CdkDemoApigwWithCognitoStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: CdkDemoApigwWithCognitoStackProps
  ) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, 'userPool', {
      selfSignUpEnabled: false,
      standardAttributes: {
        email: {required: true, mutable: true},
        phoneNumber: {required: false},
      },
      signInCaseSensitive: false,
      autoVerify: {email: true},
      signInAliases: {email: true},
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    userPool.addDomain('domain', {
      cognitoDomain: {domainPrefix: props.domainPrefix},
    });
    const userPoolClient = userPool.addClient('client', {
      oAuth: {
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: props.callbackUrls,
        logoutUrls: props.logoutUrls,
        flows: {authorizationCodeGrant: true},
      },
    });

    const handler = new nodejs.NodejsFunction(this, 'Handler');

    const authorizer = new authz.HttpUserPoolAuthorizer({
      authorizerName: 'CognitoAuthorizer',
      userPool,
      userPoolClient,
    });

    const httpApi = new apigw.HttpApi(this, 'Api', {
      defaultAuthorizer: authorizer,
      corsPreflight: {
        allowOrigins: props.frontendUrls,
        allowMethods: [apigw.CorsHttpMethod.ANY],
        allowHeaders: ['authorization'],
      },
    });
    httpApi.addRoutes({
      methods: [HttpMethod.GET],
      path: '/pets',
      integration: new intg.LambdaProxyIntegration({handler}),
    });

    new cdk.CfnOutput(this, 'OutputApiUrl', {value: httpApi.url!});
    new cdk.CfnOutput(this, 'OutputDomainPrefix', {value: props.domainPrefix});
    new cdk.CfnOutput(this, 'OutputClientId', {
      value: userPoolClient.userPoolClientId,
    });
  }
}
