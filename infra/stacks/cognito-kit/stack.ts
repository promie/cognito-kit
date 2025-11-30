import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { ApiGatewayConstruct } from './constructs/api/apiGateway.construct'
import { AuthenticationConstruct } from './constructs/auth/authentication.construct'

import { HealthConstruct } from './constructs/handlers/health.construct'

export type CognitoKitStackProps = StackProps & {
  appName: string
  stage: string
}

export class CognitoKitStack extends Stack {
  public readonly apiUrl: string

  constructor(scope: Construct, id: string, props: CognitoKitStackProps) {
    super(scope, id, props)

    const { appName, stage } = props

    // API Gateway
    const apiGateway = new ApiGatewayConstruct(this, 'ApiGateway', {
      appName,
      stage,
    })

    // Health Endpoint (Public)
    new HealthConstruct(this, 'Health', {
      appName,
      api: apiGateway.api,
    })

    const authResource = apiGateway.api.root.addResource('auth')

    // Authentication (Cognito, User Table, Auth Endpoints)
    const authentication = new AuthenticationConstruct(this, 'Authentication', {
      appName,
      stage,
      authResource,
    })

    // DynamoDB Outputs
    new CfnOutput(this, 'UserTableName', {
      value: authentication.userTable.tableName,
      description: 'DynamoDB table name for user data',
      exportName: `${appName} -${stage} -UserTableName`,
    })

    // Cognito Outputs
    new CfnOutput(this, 'UserPoolId', {
      value: authentication.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${appName} -${stage} -UserPoolId`,
    })

    new CfnOutput(this, 'UserPoolClientId', {
      value: authentication.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `${appName} -${stage} -UserPoolClientId`,
    })

    // API Gateway Outputs
    new CfnOutput(this, 'ApiUrl', {
      value: apiGateway.api.url,
      description: 'API Gateway URL',
      exportName: `${appName} -${stage} -ApiUrl`,
    })

    this.apiUrl = apiGateway.api.url
  }
}
