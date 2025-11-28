import { RemovalPolicy } from 'aws-cdk-lib'
import {
  AttributeType,
  BillingMode,
  Table,
  TableEncryption,
} from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export interface UserTableConstructProps {
  appName: string
  stage: string
}

export class UserTableConstruct extends Construct {
  public readonly table: Table

  constructor(scope: Construct, id: string, props: UserTableConstructProps) {
    super(scope, id)

    const { appName, stage } = props

    this.table = new Table(this, 'UserTable', {
      tableName: `${appName}-${stage}-users`,
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'entityType',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy:
        stage === 'production' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })

    // GSI for email lookups
    this.table.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: {
        name: 'email',
        type: AttributeType.STRING,
      },
    })
  }
}
