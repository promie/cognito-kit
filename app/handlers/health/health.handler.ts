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

const logger = createLogger('health-handler')

export const handler: APIGatewayProxyHandler = async (
  event,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  logger.info('Health check request received', {
    requestId: context.awsRequestId,
    httpMethod: event.httpMethod,
    path: event.path,
  })

  const headers = getCorsHeaders()

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsPreflightResponse()
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'OK',
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
    }),
  }
}
