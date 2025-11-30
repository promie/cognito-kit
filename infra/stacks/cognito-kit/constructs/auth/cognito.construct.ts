import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import {
  AccountRecovery,
  Mfa,
  UserPool,
  UserPoolClient,
  UserPoolClientIdentityProvider,
  UserPoolEmail,
  VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

export interface CognitoConstructProps {
  appName: string
  stage: string
  postConfirmationLambda?: IFunction
}

export class CognitoConstruct extends Construct {
  public readonly userPool: UserPool
  public readonly userPoolClient: UserPoolClient

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id)

    const { appName, stage, postConfirmationLambda } = props

    // Create Cognito User Pool
    this.userPool = new UserPool(this, 'UserPool', {
      userPoolName: `${appName}-${stage}-user-pool`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: Duration.days(7),
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      mfa: Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false,
        otp: true,
      },
      email: UserPoolEmail.withCognito(),
      userVerification: {
        emailSubject: `Verify your email for ${appName}`,
        emailBody:
          'Hello {username}, Thanks for signing up! Your verification code is {####}',
        emailStyle: VerificationEmailStyle.CODE,
      },
      lambdaTriggers: postConfirmationLambda
        ? {
            postConfirmation: postConfirmationLambda,
          }
        : undefined,
      removalPolicy:
        stage === 'production' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })

    // Create User Pool Client (App Client)
    this.userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `${appName}-${stage}-client`,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: false,
        adminUserPassword: false,
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
      refreshTokenValidity: Duration.days(30),
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
    })
  }
}
