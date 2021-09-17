import * as apigw from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import { CfnOutput, Construct, Stack, StackProps } from '@aws-cdk/core';
import dynamodb = require('@aws-cdk/aws-dynamodb');
import * as path from 'path';
import * as cdk from '@aws-cdk/core';

export class CdkCloudFormationAppreciationDashboardStack extends cdk.Stack {

  public readonly urlOutput: CfnOutput;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'Messages', {
      partitionKey: { name: 'messsage', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    new cdk.CfnOutput(this, 'ddbTable', { value: table.tableName });

    // The Lambda function that contains the functionality
    const readHandler = new lambda.Function(this, 'ReadLambda', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'read-lambda')),
      environment: {
        "TABLE": table.tableName
      }
    });

    table.grantFullAccess(readHandler);

    // The Lambda function that contains the functionality
    const createHandler = new lambda.Function(this, 'CreateLambda', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'create-lambda')),
      environment: {
        "TABLE": table.tableName
      }
    });

    table.grantFullAccess(createHandler);

    // An API Gateway to make the Lambda web-accessible
    const api = new apigw.RestApi(this, 'Gateway', {
      description: 'example api gateway',
      // 👇 enable CORS
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: ['http://localhost:3000'],
      },
    });

    const messages = api.root;
    messages.addMethod('GET', new apigw.LambdaIntegration(readHandler));


    messages.addMethod('POST', new apigw.LambdaIntegration(createHandler, { proxy: false,  integrationResponses: [
      {
        statusCode: "200",
        responseParameters: {
          // We can map response parameters
          // - Destination parameters (the key) are the response parameters (used in mappings)
          // - Source parameters (the value) are the integration response parameters or expressions
          'method.response.header.Access-Control-Allow-Origin': "'*'"
        }
      },
      {
        // For errors, we check if the error message is not empty, get the error data
        selectionPattern: "(\n|.)+",
        statusCode: "500",
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'"
        }
      }
    ], }), {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: "500",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        }
      ]
    });


    this.urlOutput = new CfnOutput(this, 'Url', {
      value: api.url,
    });
  }
}
