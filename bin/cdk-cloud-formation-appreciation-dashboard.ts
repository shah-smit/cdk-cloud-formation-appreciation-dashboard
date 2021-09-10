#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkCloudFormationAppreciationDashboardPipelineStack } from '../lib/cdk-cloud-formation-appreciation-dashboard-pipeline';

const app = new cdk.App();
new CdkCloudFormationAppreciationDashboardPipelineStack(app, 'CdkCloudFormationAppreciationDashboardPipelineStack', {
  env: { account: '174428063264', region: 'ap-southeast-1' },
});

app.synth();
