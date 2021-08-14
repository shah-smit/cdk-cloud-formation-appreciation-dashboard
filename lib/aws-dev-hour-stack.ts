import * as cdk from '@aws-cdk/core';

import s3 = require('@aws-cdk/aws-s3')
import lambda = require('@aws-cdk/aws-lambda')
import dynamodb = require('@aws-cdk/aws-dynamodb')
import {Duration} from '@aws-cdk/core'
import iam = require('@aws-cdk/aws-iam')
import event_sources = require('@aws-cdk/aws-lambda-event-sources')
import apigateway  = require('@aws-cdk/aws-apigateway')
import { PassthroughBehavior } from '@aws-cdk/aws-apigateway';
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

    const resizedBucket = new s3.Bucket(this, resizedBucketName, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })
    new cdk.CfnOutput(this, 'resizedBucket', {value: resizedBucket.bucketName})

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
