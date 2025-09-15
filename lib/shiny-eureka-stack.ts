import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as cpactions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
// import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class ShinyEurekaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const pipeline = new codepipeline.Pipeline(this, 'Entrix-App-Deploy-Pipeline', {
      pipelineName: 'Entrix-App-Deploy-Pipeline',
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new cpactions.GitHubSourceAction({
          actionName: 'GitHub_Source',
          owner: 'nirupamak',
          repo: 'laughing-waffle',
          branch: 'main',
          oauthToken: cdk.SecretValue.secretsManager('github-token-nk'),
          output: sourceOutput,
          trigger: cpactions.GitHubTrigger.NONE,
        }),
      ],
    });
    pipeline.addStage({
      stageName: 'BuildAndDeploy',
      actions: [
        new cpactions.CodeBuildAction({
          actionName: 'Build',
          project: new codebuild.PipelineProject(this, 'BuildProject', {
            buildSpec: codebuild.BuildSpec.fromObject({
              version: '0.2',
              phases: {
                install: {
                  commands: ['cd deployment-cdk','npm install'],
                },
                build: {
                  commands: ['cd deployment-cdk' ,'cdk deploy --require-approval never'],
                },
              },
            }),
          }),
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });


  }
}
