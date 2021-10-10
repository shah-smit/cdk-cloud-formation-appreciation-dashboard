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

Secrets and Parameters definition:

Creating a secret:
```
aws secretsmanager create-secret --name devhour-backend-git-access-token --secret-value test
```

To See if went correct:
```
aws secretsmanager describe-secret --secret-id devhour-backend-git-access-token
```


The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
 * `for bucket in $(aws s3 ls | awk '{print $3}' | grep cdk); do  aws s3 rb "s3://${bucket}" --force ; done` to delete buckets that matches `todelete`

```
 cdk bootstrap \
  --profile default \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
  aws://174428063264/ap-southeast-1
```

##### API Definitation

POST:

Adding a single message to DynamoDB
```
{
    "to":"xxxx@gmail.com",
    "message":"{{$randomCatchPhrase}}",
    "from": "smxxxh95@gmail.com",
    "nickName":"Raja",
    "senderName": "Smit"
}
```


GET:

Getting all the messages from DynamoDB
```
[
    {
        "messsage": "amazing1633784967"
    }
]
```

##### References & Useful URLs

- [API Gateway](https://bobbyhadz.com/blog/aws-cdk-api-gateway-example)
