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
    const gw = new apigw.LambdaRestApi(this, 'Gateway', {
      description: 'Endpoint for a simple Lambda-powered web service',
      handler: readHandler,
    });

    this.urlOutput = new CfnOutput(this, 'Url', {
      value: gw.url,
    });
  }
}
