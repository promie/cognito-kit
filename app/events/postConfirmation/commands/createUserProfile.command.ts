import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { createLogger } from '../../../common/logger'

const logger = createLogger('create-user-profile-command')
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export type CreateUserProfileInput = {
  userId: string
  email: string
  tableName: string
}

export type CreateUserProfileOutput = {
  userId: string
}

/**
 * Creates a user profile in DynamoDB after Cognito confirmation
 *
 */
export async function createUserProfile(
  input: CreateUserProfileInput,
): Promise<CreateUserProfileOutput> {
  const { userId, email, tableName } = input

  logger.info('Creating user profile in DynamoDB', { userId, email })

  const now = new Date().toISOString()

  await dynamoClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        userId,
        entityType: 'PROFILE',
        email,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE',
      },
      // Prevent overwriting existing profile
      ConditionExpression: 'attribute_not_exists(userId)',
    }),
  )

  logger.info('User profile created successfully', { userId, email })

  return { userId }
}
