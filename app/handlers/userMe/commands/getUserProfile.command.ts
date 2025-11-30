import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { GetCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { createLogger } from '../../../common/logger'

const logger = createLogger('get-user-profile-command')
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export type GetUserProfileInput = {
  userId: string
  tableName: string
}

export type UserProfile = {
  userId: string
  email: string
  status: string
  createdAt: string
  updatedAt: string
}

export type GetUserProfileOutput = {
  user: UserProfile | null
}

/**
 * Retrieves a user profile from DynamoDB
 */
export async function getUserProfile(
  input: GetUserProfileInput,
): Promise<GetUserProfileOutput> {
  const { userId, tableName } = input

  logger.info('Fetching user profile', { userId })

  const result = await dynamoClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        userId,
        entityType: 'PROFILE',
      },
    }),
  )

  if (!result.Item) {
    logger.warn('User profile not found', { userId })
    return { user: null }
  }

  const user = result.Item as UserProfile
  logger.info('User profile fetched successfully', { userId })

  return { user }
}
