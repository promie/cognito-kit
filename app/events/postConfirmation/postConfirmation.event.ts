import { PostConfirmationTriggerHandler } from 'aws-lambda'
import { createLogger } from '../../common/logger'
import { createUserProfile } from './commands/createUserProfile.command'
import { initConfig } from './config'

const logger = createLogger('post-confirmation-trigger')
const { USER_TABLE_NAME } = initConfig()

/**
 * Cognito Post-Confirmation Trigger
 * Automatically creates a DynamoDB profile record when a user confirms their email
 */
export const handler: PostConfirmationTriggerHandler = async event => {
  logger.info('Post-confirmation trigger invoked', {
    userPoolId: event.userPoolId,
    userName: event.userName,
    triggerSource: event.triggerSource,
  })

  try {
    const userId = event.request.userAttributes.sub
    const email = event.request.userAttributes.email

    if (!userId || !email) {
      logger.error('Missing required user attributes', {
        userId,
        email,
      })
      throw new Error('Missing required user attributes')
    }

    // Create user profile in DynamoDB
    await createUserProfile({
      userId,
      email,
      tableName: USER_TABLE_NAME,
    })

    logger.info('Post-confirmation processing completed', {
      userId,
      email,
    })

    // Return the event to Cognito (required)
    return event
  } catch (error) {
    logger.error('Error in post-confirmation trigger', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Even if DynamoDB fails, we should return the event
    // to allow the user to be confirmed in Cognito
    // You can choose to throw here if you want to block confirmation on DB failure
    return event
  }
}
