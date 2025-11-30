import { Duration } from 'aws-cdk-lib'
import { LambdaIntegration, Resource } from 'aws-cdk-lib/aws-apigateway'
import { UserPoolClient } from 'aws-cdk-lib/aws-cognito'
import { Construct } from 'constructs'
import { join } from 'path'
import { StandardLambda } from '../../../../common/StandardLambda'
import type { Config } from '../../../../../app/handlers/userVerifyEmail/config'

export interface UserVerifyEmailConstructProps {
  appName: string
  authResource: Resource
  userPoolClient: UserPoolClient
}

export class UserVerifyEmailConstruct extends Construct {
  public readonly lambda: StandardLambda

  constructor(
    scope: Construct,
    id: string,
    props: UserVerifyEmailConstructProps,
  ) {
    super(scope, id)

    const { appName, authResource, userPoolClient } = props

    this.lambda = new StandardLambda(this, 'VerifyEmailFunction', {
      appName,
      entry: join(
        __dirname,
        '../../../../../app/handlers/userVerifyEmail/userVerifyEmail.handler.ts',
      ),
      handler: 'handler',
      memorySize: 256,
      timeout: Duration.seconds(30),
      environment: {
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      } satisfies Config,
    })

    const verifyEmailResource = authResource.addResource('verify-email')
    verifyEmailResource.addMethod('POST', new LambdaIntegration(this.lambda))
  }
}
