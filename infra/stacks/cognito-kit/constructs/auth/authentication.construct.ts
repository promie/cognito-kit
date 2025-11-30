import { Resource } from 'aws-cdk-lib/aws-apigateway'
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import { CognitoConstruct } from './cognito.construct'
import { PostConfirmationConstruct } from '../events/postConfirmation.construct'
import { UserLoginConstruct } from '../handlers/userLogin.construct'
import { UserMeConstruct } from '../handlers/userMe.construct'
import { UserSignupConstruct } from '../handlers/userSignup.construct'
import { UserVerifyEmailConstruct } from '../handlers/userVerifyEmail.construct'
import { UserTableConstruct } from '../storage/userTable.construct'

export interface AuthenticationConstructProps {
  appName: string
  stage: string
  authResource: Resource
}

export class AuthenticationConstruct extends Construct {
  public readonly userPool: UserPool
  public readonly userPoolClient: UserPoolClient
  public readonly userTable: Table

  constructor(
    scope: Construct,
    id: string,
    props: AuthenticationConstructProps,
  ) {
    super(scope, id)

    const { appName, stage, authResource } = props

    // DynamoDB Table for user data
    const userTableConstruct = new UserTableConstruct(this, 'UserTable', {
      appName,
      stage,
    })
    this.userTable = userTableConstruct.table

    // Post-Confirmation Lambda Trigger (creates DynamoDB profile after email verification)
    const postConfirmation = new PostConfirmationConstruct(
      this,
      'PostConfirmation',
      {
        appName,
        userTable: this.userTable,
      },
    )

    // Cognito User Pool for authentication
    const cognito = new CognitoConstruct(this, 'Cognito', {
      appName,
      stage,
      postConfirmationLambda: postConfirmation.lambda,
    })
    this.userPool = cognito.userPool
    this.userPoolClient = cognito.userPoolClient

    // Auth API Endpoints
    new UserSignupConstruct(this, 'UserSignup', {
      appName,
      authResource,
      userPoolClient: this.userPoolClient,
    })

    new UserVerifyEmailConstruct(this, 'UserVerifyEmail', {
      appName,
      authResource,
      userPoolClient: this.userPoolClient,
    })

    new UserLoginConstruct(this, 'UserLogin', {
      appName,
      authResource,
      userPoolClient: this.userPoolClient,
    })

    new UserMeConstruct(this, 'UserMe', {
      appName,
      authResource,
      userPool: this.userPool,
      userTable: this.userTable,
    })
  }
}
