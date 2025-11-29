import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider'
import { createLogger } from '../../../common/logger'

const logger = createLogger('login-user-command')
const cognitoClient = new CognitoIdentityProviderClient({})

export type LoginUserInput = {
  email: string
  password: string
  userPoolClientId: string
}

export type LoginUserOutput = {
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * Authenticates a user with Cognito
 *
 */
export async function loginUser(
  input: LoginUserInput,
): Promise<LoginUserOutput> {
  const { email, password, userPoolClientId } = input

  logger.info('Authenticating user', { email })

  const authParams: InitiateAuthCommandInput = {
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    ClientId: userPoolClientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  }

  const command = new InitiateAuthCommand(authParams)
  const response = await cognitoClient.send(command)

  if (!response.AuthenticationResult) {
    throw new Error('Authentication failed - no tokens returned')
  }

  const { AccessToken, IdToken, RefreshToken, ExpiresIn } =
    response.AuthenticationResult

  if (!AccessToken || !IdToken || !RefreshToken) {
    throw new Error('Authentication failed - missing tokens')
  }

  logger.info('User authenticated successfully', { email })

  return {
    accessToken: AccessToken,
    idToken: IdToken,
    refreshToken: RefreshToken,
    expiresIn: ExpiresIn || 3600,
  }
}
