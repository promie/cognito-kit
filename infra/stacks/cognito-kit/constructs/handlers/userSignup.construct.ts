import { Duration } from 'aws-cdk-lib'
import { LambdaIntegration, Resource } from 'aws-cdk-lib/aws-apigateway'
import { UserPoolClient } from 'aws-cdk-lib/aws-cognito'
import { Construct } from 'constructs'
import { join } from 'path'
import { StandardLambda } from '../../../../common/StandardLambda'
import type { Config } from '../../../../../app/handlers/userSignup/config'

export interface UserSignupConstructProps {
  appName: string
  authResource: Resource
  userPoolClient: UserPoolClient
}

export class UserSignupConstruct extends Construct {
  public readonly lambda: StandardLambda

  constructor(scope: Construct, id: string, props: UserSignupConstructProps) {
    super(scope, id)

    const { appName, authResource, userPoolClient } = props

    // Create signup Lambda function
    this.lambda = new StandardLambda(this, 'SignupFunction', {
      appName,
      entry: join(
        __dirname,
        '../../../../../app/handlers/userSignup/userSignup.handler.ts',
      ),
      handler: 'handler',
      memorySize: 256,
      timeout: Duration.seconds(30),
      environment: {
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      } satisfies Config,
    })

    // Add /auth/signup route
    const signupResource = authResource.addResource('signup')
    signupResource.addMethod('POST', new LambdaIntegration(this.lambda))
  }
}
