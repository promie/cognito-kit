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
import { getUserProfile } from './commands/getUserProfile.command'
import { initConfig } from './config'

const logger = createLogger('user-me-handler')
const { USER_TABLE_NAME } = initConfig()

export const handler: APIGatewayProxyHandler = async (
  event,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  logger.info('Get user profile request received', {
    requestId: context.awsRequestId,
    httpMethod: event.httpMethod,
    path: event.path,
  })

  const headers = getCorsHeaders()

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsPreflightResponse()
  }

  try {
    // Extract userId from Cognito Authorizer
    // The 'sub' claim contains the unique user ID (Cognito Username/UUID)
    const claims = event.requestContext.authorizer?.claims as
      | { sub: string }
      | undefined

    if (!claims || !claims.sub) {
      logger.warn('Missing authorizer claims', {
        authorizer: event.requestContext.authorizer,
      })
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      }
    }

    const userId = claims.sub

    const { user } = await getUserProfile({
      userId,
      tableName: USER_TABLE_NAME,
    })

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User profile not found' }),
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(user),
    }
  } catch (error) {
    logger.error('Error fetching user profile', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    })

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch user profile' }),
    }
  }
}
