import { Duration } from 'aws-cdk-lib'
import { LambdaIntegration, Resource } from 'aws-cdk-lib/aws-apigateway'
import { UserPoolClient } from 'aws-cdk-lib/aws-cognito'
import { Construct } from 'constructs'
import { join } from 'path'
import { StandardLambda } from '../../../../common/StandardLambda'
import type { Config } from '../../../../../app/handlers/userLogin/config'

export interface UserLoginConstructProps {
    appName: string
    authResource: Resource
    userPoolClient: UserPoolClient
}

export class UserLoginConstruct extends Construct {
    public readonly lambda: StandardLambda

    constructor(scope: Construct, id: string, props: UserLoginConstructProps) {
        super(scope, id)

        const { appName, authResource, userPoolClient } = props

        this.lambda = new StandardLambda(this, 'LoginFunction', {
            appName,
            entry: join(
                __dirname,
                '../../../../../app/handlers/userLogin/userLogin.handler.ts',
            ),
            handler: 'handler',
            memorySize: 256,
            timeout: Duration.seconds(30),
            environment: {
                USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            } satisfies Config,
        })

        const loginResource = authResource.addResource('login')
        loginResource.addMethod('POST', new LambdaIntegration(this.lambda))
    }
}
