# CDK Cloud Formation Appreciation Dashboard

![AWS arch image](https://github.com/shah-smit/cdk-cloud-formation-appreciation-dashboard/blob/main/docs/AWS%20Appreciation%20Dashboard.drawio.png)



### Deploying a single stack

To deploy

```
cdk deploy DashboardStack
```

To Destroy

```
cdk destroy DashboardStack
```

### Deploying the pipeline

```
cdk deploy CdkCloudFormationAppreciationDashboardPipelineStack
```

Now all the commits will be auto deploy to AWS.

```
cdk destroy CdkCloudFormationAppreciationDashboardPipelineStack
```

```
cdk destroy CdkCloudFormationAppreciationDashboardPipelineStack/PreProd/WebService
cdk destroy CdkCloudFormationAppreciationDashboardPipelineStack/Manual/DefaultStack
cdk destroy CdkCloudFormationAppreciationDashboardPipelineStack/Prod/WebService
```



The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


```
 cdk bootstrap \
  --profile default \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
  aws://174428063264/ap-southeast-1
```


##### References & Useful URLs

- [API Gateway](https://bobbyhadz.com/blog/aws-cdk-api-gateway-example)
