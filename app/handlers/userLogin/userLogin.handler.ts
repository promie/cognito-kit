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
import { loginUser } from './commands/loginUser.command'
import { initConfig } from './config'
import { bodySchema } from './bodySchema'

const logger = createLogger('login-handler')
const { USER_POOL_CLIENT_ID } = initConfig()

export const handler: APIGatewayProxyHandler = async (
  event,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  logger.info('Login request received', {
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

    const { email, password } = validationResult.data

    // Authenticate user using command
    const result = await loginUser({
      email,
      password,
      userPoolClientId: USER_POOL_CLIENT_ID,
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    }
  } catch (error) {
    logger.error('Error during login', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Handle Cognito-specific errors
    if (error instanceof Error) {
      if (error.name === 'NotAuthorizedException') {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            error: 'NotAuthorizedException',
            message: 'Incorrect email or password',
          }),
        }
      }

      if (error.name === 'UserNotConfirmedException') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            error: 'UserNotConfirmedException',
            message: 'Please verify your email before logging in',
          }),
        }
      }

      if (error.name === 'UserNotFoundException') {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            error: 'NotAuthorizedException',
            message: 'Incorrect email or password',
          }),
        }
      }

      if (error.name === 'TooManyRequestsException') {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            error: 'TooManyRequestsException',
            message: 'Too many login attempts. Please try again later',
          }),
        }
      }
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to authenticate user' }),
    }
  }
}
