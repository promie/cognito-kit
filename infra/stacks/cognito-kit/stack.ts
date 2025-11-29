import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { ApiGatewayConstruct } from './constructs/api/apiGateway.construct'
import { CognitoConstruct } from './constructs/auth/cognito.construct'
import { UserSignupConstruct } from './constructs/handlers/userSignup.construct'
import { UserTableConstruct } from './constructs/storage/userTable.construct'

export type CognitoKitStackProps = StackProps & {
  appName: string
  stage: string
}

export class CognitoKitStack extends Stack {
  public readonly apiUrl: string

  constructor(scope: Construct, id: string, props: CognitoKitStackProps) {
    super(scope, id, props)

    const { appName, stage } = props

    // DynamoDB Table for user data
    const userTable = new UserTableConstruct(this, 'UserTable', {
      appName,
      stage,
    })

    // Cognito User Pool for authentication
    const cognito = new CognitoConstruct(this, 'Cognito', {
      appName,
      stage,
    })

    const apiGateway = new ApiGatewayConstruct(this, 'ApiGateway', {
      appName,
      stage,
    })

    const authResource = apiGateway.api.root.addResource('auth')

    new UserSignupConstruct(this, 'UserSignup', {
      appName,
      authResource,
      userPoolClient: cognito.userPoolClient,
    })

    // DynamoDB Outputs
    new CfnOutput(this, 'UserTableName', {
      value: userTable.table.tableName,
      description: 'DynamoDB table name for user data',
      exportName: `${appName}-${stage}-UserTableName`,
    })

    new CfnOutput(this, 'UserTableArn', {
      value: userTable.table.tableArn,
      description: 'DynamoDB table ARN for user data',
      exportName: `${appName}-${stage}-UserTableArn`,
    })

    // Cognito Outputs
    new CfnOutput(this, 'UserPoolId', {
      value: cognito.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${appName}-${stage}-UserPoolId`,
    })

    new CfnOutput(this, 'UserPoolClientId', {
      value: cognito.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `${appName}-${stage}-UserPoolClientId`,
    })

    new CfnOutput(this, 'UserPoolArn', {
      value: cognito.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `${appName}-${stage}-UserPoolArn`,
    })
  }
}
