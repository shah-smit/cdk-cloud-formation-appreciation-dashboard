import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';

/**
 * Deployable unit of web service app
 */
 export class CdkCloudFormationAppreciationDashboardDefaultStage extends Stage {
    public readonly urlOutput: CfnOutput;
    
    constructor(scope: Construct, id: string, props?: StageProps) {
      super(scope, id, props);
  
    }
  }
