import { Duration } from 'aws-cdk-lib'
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import { join } from 'path'
import { StandardLambda } from '../../../../common/StandardLambda'
import type { Config } from '../../../../../app/handlers/userMe/config'

export interface UserMeConstructProps {
  appName: string
  authResource: Resource
  userPool: UserPool
  userTable: Table
}

export class UserMeConstruct extends Construct {
  public readonly lambda: StandardLambda

  constructor(scope: Construct, id: string, props: UserMeConstructProps) {
    super(scope, id)

    const { appName, authResource, userPool, userTable } = props

    this.lambda = new StandardLambda(this, 'UserMeFunction', {
      appName,
      entry: join(
        __dirname,
        '../../../../../app/handlers/userMe/userMe.handler.ts',
      ),
      handler: 'handler',
      memorySize: 256,
      timeout: Duration.seconds(30),
      environment: {
        USER_TABLE_NAME: userTable.tableName,
      } satisfies Config,
    })

    // Grant Lambda permission to read from DynamoDB
    userTable.grantReadData(this.lambda)

    // Create Cognito Authorizer
    const authorizer = new CognitoUserPoolsAuthorizer(
      this,
      'CognitoAuthorizer',
      {
        cognitoUserPools: [userPool],
        authorizerName: `${appName}-authorizer`,
      },
    )

    // Add GET /auth/me endpoint
    const meResource = authResource.addResource('me')
    meResource.addMethod('GET', new LambdaIntegration(this.lambda), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    })
  }
}
