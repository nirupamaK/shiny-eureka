import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as cpactions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
// import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class ShinyEurekaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'cd deployment-cdk',
              'npm install -g aws-cdk',
              'npm install',
            ],
          },
        build: {
         commands: ['cdk deploy --require-approval never'],
        },
      },
    }),
    });

    buildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/cdk-bootstrap/hnb659fds/version`],
    }));

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
        project: buildProject,
        input: sourceOutput,
        outputs: [buildOutput],
    }),
    ],
    });
  }
}
