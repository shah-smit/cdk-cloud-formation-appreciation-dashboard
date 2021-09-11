# Welcome to your CDK TypeScript project!

![AWS arch image](https://github.com/shah-smit/cdk-cloud-formation-appreciation-dashboard/blob/main/docs/AWS%20Appreciation%20Dashboard.drawio.png)


This is a blank project for TypeScript development with CDK.

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
