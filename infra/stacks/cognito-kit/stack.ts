import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export type CognitoKitStackProps = StackProps & {
  appName: string
  stage: string
}

export class CognitoKitStack extends Stack {
  public readonly apiUrl: string

  constructor(scope: Construct, id: string, props: CognitoKitStackProps) {
    super(scope, id, props)

    const { appName, stage } = props
  }
}
