import * as apigw from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import { CfnOutput, Construct, Stack, StackProps } from '@aws-cdk/core';
import dynamodb = require('@aws-cdk/aws-dynamodb');
import * as path from 'path';
import * as cdk from '@aws-cdk/core';

/**
 * A stack for our simple Lambda-powered web service
 */
export class CdkpipelinesDemoStack extends Stack {
  /**
   * The URL of the API Gateway endpoint, for use in the integ tests
   */
  public readonly urlOutput: CfnOutput;
 
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'Messages', {
      partitionKey: { name: 'messsage', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    new cdk.CfnOutput(this, 'ddbTable', { value: table.tableName });

    // The Lambda function that contains the functionality
    const handler = new lambda.Function(this, 'Lambda', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')),
    });

    table.grantReadWriteData(handler);

    // An API Gateway to make the Lambda web-accessible
    const gw = new apigw.LambdaRestApi(this, 'Gateway', {
      description: 'Endpoint for a simple Lambda-powered web service',
      handler,
    });

    this.urlOutput = new CfnOutput(this, 'Url', {
      value: gw.url,
    });
  }
}