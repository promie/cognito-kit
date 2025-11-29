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
import { signupUser } from './commands/signupUser.command'
import { initConfig } from './config'
import { bodySchema } from './bodySchema'

const logger = createLogger('signup-handler')
const { USER_POOL_CLIENT_ID } = initConfig()

export const handler: APIGatewayProxyHandler = async (
  event,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  logger.info('Signup request received', {
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

    // Sign up user using command
    const result = await signupUser({
      email,
      password,
      userPoolClientId: USER_POOL_CLIENT_ID,
    })

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(result),
    }
  } catch (error) {
    logger.error('Error during signup', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Handle Cognito-specific errors
    if (error instanceof Error) {
      if (error.name === 'UsernameExistsException') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'UsernameExistsException',
            message: 'An account with this email already exists',
          }),
        }
      }

      if (error.name === 'InvalidPasswordException') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'InvalidPasswordException',
            message: 'Password does not meet requirements',
          }),
        }
      }

      if (error.name === 'InvalidParameterException') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'InvalidParameterException',
            message: error.message || 'Invalid parameters provided',
          }),
        }
      }
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to sign up user' }),
    }
  }
}
