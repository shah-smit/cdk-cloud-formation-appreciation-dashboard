import * as cdk from '@aws-cdk/core';

import s3 = require('@aws-cdk/aws-s3')
import lambda = require('@aws-cdk/aws-lambda')
import dynamodb = require('@aws-cdk/aws-dynamodb')
import {Duration, CfnOutput} from '@aws-cdk/core'
import iam = require('@aws-cdk/aws-iam')
import event_sources = require('@aws-cdk/aws-lambda-event-sources')
import apigateway  = require('@aws-cdk/aws-apigateway')
import { AuthorizationType, PassthroughBehavior } from '@aws-cdk/aws-apigateway';
import cognito = require('@aws-cdk/aws-cognito')




const imageBucketName = "cdk-rekn-imagebucket-smit"
const resizedBucketName = imageBucketName + "-resized"

export class AwsDevHourStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const imageBucket = new s3.Bucket(this, imageBucketName, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })
    new cdk.CfnOutput(this, 'imageBucket', {value: imageBucket.bucketName})
    const imageBucketArn = imageBucket.bucketArn;

    const resizedBucket = new s3.Bucket(this, resizedBucketName, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })
    new cdk.CfnOutput(this, 'resizedBucket', {value: resizedBucket.bucketName})
    const resizedBucketArn = resizedBucket.bucketArn;

    const table  = new dynamodb.Table(this, "ImageLabels",  {
      partitionKey: {name: "image", type: dynamodb.AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })
    new cdk.CfnOutput(this, "ddbtable", {value: table.tableName})

    // =====================================================================================
    // Building our AWS Lambda Function; compute for our serverless microservice
    // =====================================================================================
    const layer = new lambda.LayerVersion(this, 'pil', {
      code: lambda.Code.fromAsset('reklayer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_7],
      license: 'Apache-2.0',
      description: 'A layer to enable the PIL library in our Rekognition Lambda',
    });

    const rekFn = new lambda.Function(this, "rekognitionFunction", {
      code: lambda.Code.fromAsset('rekognitionlambda'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'index.handler',
      timeout: Duration.seconds(30),
      memorySize: 1024,
      layers: [layer],
      environment: {
        "TABLE": table.tableName,
        "BUCKET": imageBucket.bucketName,
        "THUMBBUCKET": resizedBucket.bucketName
      }
    })

    rekFn.addEventSource(new event_sources.S3EventSource(imageBucket, {events: [s3.EventType.OBJECT_CREATED]}))
    imageBucket.grantRead(rekFn)
    table.grantWriteData(rekFn)
    resizedBucket.grantPut(rekFn)

    rekFn.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['rekognition:DetectLabels'],
      resources: ['*']
    }))

    const serviceFn = new lambda.Function(this, 'serviceFunction', {
      code: lambda.Code.fromAsset('servicelambda'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'index.handler',
      environment: {
        "TABLE": table.tableName,
        "BUCKET": imageBucket.bucketName,
        "THUMBBUCKET": resizedBucket.bucketName
      }
    })

    imageBucket.grantWrite(serviceFn)
    resizedBucket.grantWrite(serviceFn)
    table.grantReadWriteData(serviceFn)

    const api = new apigateway.LambdaRestApi(this, 'imageAPI', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      },
      handler: serviceFn,
      proxy: false
    })


    const userpool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      signInAliases: { username: true, email: true}
    })

    const userpoolclient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: userpool,
      generateSecret: false
    })

    const identitypool = new cognito.CfnIdentityPool(this, 'ImageRekognitionIdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userpoolclient.userPoolClientId,
          providerName: userpool.userPoolProviderName
        }
      ]
    })

    const auth = new apigateway.CfnAuthorizer(this, 'APIGatewayAuthorizer', {
      name: 'customer-authorizer',
      identitySource: 'method.request.header.Authorization',
      providerArns: [userpool.userPoolArn],
      restApiId: api.restApiId,
      type: AuthorizationType.COGNITO
    })

    const authenticatedRole = new iam.Role(this, 'ImageRekognitionAuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com', 
        {
          StringEquals: {
            "cognito-identity.amazon.com:aud": identitypool.ref
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated"
          }
        },
        'sts:AssumeRoleWithWebIdentity'
      )
    })

    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "s3:GetObject",
          "s3:PutObject"
        ],
        effect: iam.Effect.ALLOW,
        resources: [
          imageBucketArn + "/private/${cognito-identity.amazonaws.com:sub}/*",
          imageBucketArn + "/private/${cognito-identity.amazonaws.com:sub}",
          resizedBucketArn + "/private/${cognito-identity.amazonaws.com:sub}/*",
          resizedBucketArn + "/private/${cognito-identity.amazonaws.com:sub}"
        ],
      })
    );

    // IAM policy granting users permission to list their pictures
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["s3:ListBucket"],
        effect: iam.Effect.ALLOW,
        resources: [
          imageBucketArn,
          resizedBucketArn
        ],
        conditions: {"StringLike": {"s3:prefix": ["private/${cognito-identity.amazonaws.com:sub}/*"]}}
      })
    );

    new cognito.CfnIdentityPoolRoleAttachment(this, "IdentityPoolRoleAttachment", {
      identityPoolId: identitypool.ref,
      roles: { authenticated: authenticatedRole.roleArn },
    });

    new CfnOutput(this, "UserPoolId", {
      value: userpool.userPoolId,
    });
    new CfnOutput(this, "AppClientId", {
      value: userpoolclient.userPoolClientId,
    });
    new CfnOutput(this, "IdentityPoolId", {
      value: identitypool.ref,
    });
    

    const lambdaIntegration = new apigateway.LambdaIntegration(serviceFn, {
      proxy: false,
      requestParameters: {
        'integration.request.querystring.action': 'method.request.querystring.action',
        'integration.request.querystring.key': 'method.request.querystring.key',
      },

      requestTemplates: {
        'application/json': JSON.stringify({ action: "$util.escapeJavaScript($input.params('action'))", key: "$util.escapeJavaScript($input.params('key'))" })
      },

      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'"
          }
        },
        {
          selectionPattern: "(\n|.)+",
          statusCode: "500",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'"
          }
        }
      ]
    })

    const imageAPI = api.root.addResource('images');

    imageAPI.addMethod('GET', lambdaIntegration, {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: auth.ref},
      requestParameters: {
        'method.request.querystring.action': true,
        'method.request.querystring.key': true
      },
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true
          }
        },
        {
          statusCode: "500",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true
          }
        }
      ]
    })

    imageAPI.addMethod('DELETE', lambdaIntegration, {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: auth.ref},
      requestParameters: {
        'method.request.querystring.action': true,
        'method.request.querystring.key': true
      },
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true
          }
        },
        {
          statusCode: "500",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true
          }
        }
      ]
    })


  }
}
