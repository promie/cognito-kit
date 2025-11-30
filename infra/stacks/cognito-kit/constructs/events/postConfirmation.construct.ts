import { Duration } from 'aws-cdk-lib'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import { join } from 'path'
import { StandardLambda } from '../../../../common/StandardLambda'
import type { Config } from '../../../../../app/events/postConfirmation/config'

export interface PostConfirmationConstructProps {
  appName: string
  userTable: Table
}

export class PostConfirmationConstruct extends Construct {
  public readonly lambda: StandardLambda

  constructor(
    scope: Construct,
    id: string,
    props: PostConfirmationConstructProps,
  ) {
    super(scope, id)

    const { appName, userTable } = props

    this.lambda = new StandardLambda(this, 'PostConfirmationFunction', {
      appName,
      entry: join(
        __dirname,
        '../../../../../app/events/postConfirmation/postConfirmation.event.ts',
      ),
      handler: 'handler',
      memorySize: 256,
      timeout: Duration.seconds(30),
      environment: {
        USER_TABLE_NAME: userTable.tableName,
      } satisfies Config,
    })

    userTable.grantWriteData(this.lambda)
  }
}
