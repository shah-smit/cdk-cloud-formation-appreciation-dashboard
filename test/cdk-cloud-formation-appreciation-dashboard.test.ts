import { expect as expectCDK, matchTemplate, MatchStyle, haveResource, stringLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkCloudFormationAppreciationDashboard from '../lib/cdk-cloud-formation-appreciation-dashboard-stack';

test('Read-Lambda Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new CdkCloudFormationAppreciationDashboard.CdkCloudFormationAppreciationDashboardStack(app, 'MyTestStack');
  // THEN
  //Get Table Name

  expectCDK(stack).to(haveResource("AWS::Lambda::Function", {
    "Handler": "index.lambda_handler",
    Environment: {
      Variables: {
        TABLE: {
          Ref: stringLike("Messages*"),
        }
      }
    }
  }));
});

test('DynamoDB Table Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new CdkCloudFormationAppreciationDashboard.CdkCloudFormationAppreciationDashboardStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(haveResource("AWS::DynamoDB::Table", {
    "AttributeDefinitions": [
      {
        "AttributeName": "messsage",
        "AttributeType": "S"
      }
    ],
    "ProvisionedThroughput": {
      "ReadCapacityUnits": 5,
      "WriteCapacityUnits": 5
    }
  }));
});

test('API Gateway Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new CdkCloudFormationAppreciationDashboard.CdkCloudFormationAppreciationDashboardStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(haveResource("AWS::ApiGateway::RestApi"));
});


test('S3 Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new CdkCloudFormationAppreciationDashboard.CdkCloudFormationAppreciationDashboardStack(app, 'MyTestStack');
  // THEN
  //Get Table Name
  
  expectCDK(stack).to(haveResource("AWS::S3::Bucket", {
      "WebsiteConfiguration": {
        "ErrorDocument": "index.html",
        "IndexDocument": "index.html"
      }
  }));
});

