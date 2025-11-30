import {
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'
import { createLogger } from '../../common/logger'
import {
  getCorsHeaders,
  createCorsPreflightResponse,
} from '../../common/cors/cors'
import { verifyEmail } from './commands/verifyEmail.command'
import { initConfig } from './config'
import { bodySchema } from './bodySchema'

const logger = createLogger('verify-email-handler')
const { USER_POOL_CLIENT_ID } = initConfig()

export const handler: APIGatewayProxyHandler = async (
  event,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  logger.info('Email verification request received', {
    requestId: context.awsRequestId,
    httpMethod: event.httpMethod,
    path: event.path,
  })

  const headers = getCorsHeaders()

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    logger.info('CORS preflight request')
    return createCorsPreflightResponse()
  }

  try {
    if (!event.body) {
      logger.warn('Missing request body')
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' }),
      }
    }

    const parsedBody = JSON.parse(event.body) as unknown
    const validationResult = bodySchema.safeParse(parsedBody)

    if (!validationResult.success) {
      logger.warn('Invalid request body', {
        errors: validationResult.error.issues,
      })
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid request body',
          details: validationResult.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        }),
      }
    }

    const { email, code } = validationResult.data

    // Verify email using command
    const result = await verifyEmail({
      email,
      code,
      userPoolClientId: USER_POOL_CLIENT_ID,
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    }
  } catch (error) {
    logger.error('Error during email verification', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Handle Cognito-specific errors
    if (error instanceof Error) {
      if (error.name === 'CodeMismatchException') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'CodeMismatchException',
            message: 'Invalid verification code',
          }),
        }
      }

      if (error.name === 'ExpiredCodeException') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'ExpiredCodeException',
            message: 'Verification code has expired',
          }),
        }
      }

      if (error.name === 'NotAuthorizedException') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'NotAuthorizedException',
            message: 'User is already confirmed',
          }),
        }
      }

      if (error.name === 'UserNotFoundException') {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'UserNotFoundException',
            message: 'User not found',
          }),
        }
      }

      if (error.name === 'TooManyFailedAttemptsException') {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            error: 'TooManyFailedAttemptsException',
            message: 'Too many failed attempts. Please try again later',
          }),
        }
      }
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to verify email' }),
    }
  }
}
