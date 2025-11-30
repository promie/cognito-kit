import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  ConfirmSignUpCommandInput,
} from '@aws-sdk/client-cognito-identity-provider'
import { createLogger } from '../../../common/logger'

const logger = createLogger('verify-email-command')
const cognitoClient = new CognitoIdentityProviderClient({})

export type VerifyEmailInput = {
  email: string
  code: string
  userPoolClientId: string
}

export type VerifyEmailOutput = {
  message: string
}

/**
 * Verifies a user's email address with Cognito
 *
 */
export async function verifyEmail(
  input: VerifyEmailInput,
): Promise<VerifyEmailOutput> {
  const { email, code, userPoolClientId } = input

  logger.info('Verifying email', { email })

  const confirmParams: ConfirmSignUpCommandInput = {
    ClientId: userPoolClientId,
    Username: email,
    ConfirmationCode: code,
  }

  const command = new ConfirmSignUpCommand(confirmParams)
  await cognitoClient.send(command)

  logger.info('Email verified successfully', { email })

  return {
    message: 'Email verified successfully. You can now log in.',
  }
}
