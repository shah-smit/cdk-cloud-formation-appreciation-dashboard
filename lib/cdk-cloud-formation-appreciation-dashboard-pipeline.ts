import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import { CdkCloudFormationAppreciationDashboardStage} from './cdk-cloud-formation-appreciation-dashboard-stage';
import { CdkCloudFormationAppreciationDashboardDefaultStage } from './cdk-cloud-formation-appreciation-dashboard-default-stage';
import { ShellScriptAction } from '@aws-cdk/pipelines';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { ManualApprovalAction } from '@aws-cdk/aws-codepipeline-actions';

/**
 * The stack that defines the application pipeline
 */
 export class CdkCloudFormationAppreciationDashboardPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

      const sourceArtifact = new codepipeline.Artifact();
      const cloudAssemblyArtifact = new codepipeline.Artifact();

      const githubOwner = StringParameter.fromStringParameterAttributes(this, 'gitOwner',{
        parameterName: 'devhour-backend-git-owner'
      }).stringValue;
    
      const githubRepo = StringParameter.fromStringParameterAttributes(this, 'gitRepo',{
        parameterName: 'cdk-cloud-formation-appreciation-dashboard-github-repo'
      }).stringValue;
    
      const githubBranch = StringParameter.fromStringParameterAttributes(this, 'gitBranch',{
        parameterName: 'devhour-backend-git-branch'
      }).stringValue;

      const pipeline = new CdkPipeline(this, 'Pipeline', {
        // The pipeline name
        pipelineName: 'MyServicePipeline',
        cloudAssemblyArtifact,

        // Where the source can be found
        sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager('devhour-backend-git-access-token', {jsonField: 'devhour-backend-git-access-token'}), // this token is stored in Secret Manager
        owner: githubOwner,
        repo: githubRepo,
        branch: githubBranch
      }),

      // How it will be built and synthesized
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        
        // We need a build step to compile the TypeScript Lambda
        buildCommand: 'npm run build'
      }),
   });
   // This is where we add the application stages
   const preprod = new CdkCloudFormationAppreciationDashboardStage(this, 'PreProd');

  // put validations for the stages 
  const preprodStage = pipeline.addApplicationStage(preprod);
  
  const millis = Date.now();

  preprodStage.addActions(new ShellScriptAction({
    actionName: 'TestService',
    useOutputs: {
      // Get the stack Output from the Stage and make it available in
      // the shell script as $ENDPOINT_URL.
      ENDPOINT_URL: pipeline.stackOutput(preprod.urlOutput)
    },
    commands: [
      // Use 'curl' to GET the given URL and fail if it returns an error
      'curl -Ssf $ENDPOINT_URL',
      `curl --location --request POST $ENDPOINT_URL --header 'Content-Type: application/json' --data-raw '{ "message":"auto script" }'`
    ],
  }));


  const manualapprovalStage = pipeline.addApplicationStage(new CdkCloudFormationAppreciationDashboardDefaultStage(this, 'Manual'));

  manualapprovalStage.addActions(new ManualApprovalAction({
    actionName: 'ManualApproval',
    runOrder: preprodStage.nextSequentialRunOrder(),
  }));


  pipeline.addApplicationStage(new CdkCloudFormationAppreciationDashboardStage(this, 'Prod'));
  }
}