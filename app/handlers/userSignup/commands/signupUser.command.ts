import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  SignUpCommandInput,
} from '@aws-sdk/client-cognito-identity-provider'
import { createLogger } from '../../../common/logger'

const logger = createLogger('signup-user-command')
const cognitoClient = new CognitoIdentityProviderClient({})

export type SignupUserInput = {
  email: string
  password: string
  userPoolClientId: string
}

export type SignupUserOutput = {
  userId: string
  message: string
}

/**
 * Signs up a new user in Cognito
 *
 */
export async function signupUser(
  input: SignupUserInput,
): Promise<SignupUserOutput> {
  const { email, password, userPoolClientId } = input

  logger.info('Signing up new user', { email })

  const signUpParams: SignUpCommandInput = {
    ClientId: userPoolClientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: 'email',
        Value: email,
      },
    ],
  }

  const command = new SignUpCommand(signUpParams)
  const response = await cognitoClient.send(command)

  if (!response.UserSub) {
    throw new Error('Failed to create user - no UserSub returned')
  }

  logger.info('User signed up successfully', {
    userId: response.UserSub,
    email,
  })

  return {
    userId: response.UserSub,
    message:
      'User registered successfully. Please check your email to verify your account.',
  }
}
