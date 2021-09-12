#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkCloudFormationAppreciationDashboardPipelineStack } from '../lib/cdk-cloud-formation-appreciation-dashboard-pipeline';
import { CdkCloudFormationAppreciationDashboardStack } from '../lib/cdk-cloud-formation-appreciation-dashboard-stack';

const app = new cdk.App();
new CdkCloudFormationAppreciationDashboardStack(app, 'DashboardStack');
new CdkCloudFormationAppreciationDashboardPipelineStack(app, 'CdkCloudFormationAppreciationDashboardPipelineStack');

app.synth();
