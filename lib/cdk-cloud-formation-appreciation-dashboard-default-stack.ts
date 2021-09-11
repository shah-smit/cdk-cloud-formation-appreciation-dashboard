import { CfnOutput, Construct, Stack, StackProps } from '@aws-cdk/core';
import * as cdk from '@aws-cdk/core';

export class CdkCloudFormationAppreciationDashboardDefaultStack extends cdk.Stack {

  public readonly urlOutput: CfnOutput;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


  }
}
