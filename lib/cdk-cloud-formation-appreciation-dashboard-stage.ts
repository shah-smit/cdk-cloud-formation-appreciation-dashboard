import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { CdkCloudFormationAppreciationDashboardStack } from './cdk-cloud-formation-appreciation-dashboard-stack';

/**
 * Deployable unit of web service app
 */
 export class CdkCloudFormationAppreciationDashboardStage extends Stage {
    public readonly urlOutput: CfnOutput;
    
    constructor(scope: Construct, id: string, props?: StageProps) {
      super(scope, id, props);
  
      const service = new CdkCloudFormationAppreciationDashboardStack(this, 'WebService');
      
      // Expose CdkpipelinesDemoStack's output one level higher
      this.urlOutput = service.urlOutput;
    }
  }
