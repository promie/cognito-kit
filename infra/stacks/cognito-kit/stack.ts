import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { UserTableConstruct } from './constructs/storage/userTable.construct'

export type CognitoKitStackProps = StackProps & {
  appName: string
  stage: string
}

export class CognitoKitStack extends Stack {
  public readonly apiUrl: string

  constructor(scope: Construct, id: string, props: CognitoKitStackProps) {
    super(scope, id, props)

    const { appName, stage } = props

    const userTable = new UserTableConstruct(this, 'UserTable', {
      appName,
      stage,
    })

    new CfnOutput(this, 'UserTableName', {
      value: userTable.table.tableName,
      description: 'DynamoDB table name for user data',
      exportName: `${appName}-${stage}-UserTableName`,
    })

    new CfnOutput(this, 'UserTableArn', {
      value: userTable.table.tableArn,
      description: 'DynamoDB table ARN for user data',
      exportName: `${appName}-${stage}-UserTableArn`,
    })
  }
}
