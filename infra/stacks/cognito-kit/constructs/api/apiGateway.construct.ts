import { RemovalPolicy } from 'aws-cdk-lib'
import {
  Cors,
  LogGroupLogDestination,
  MethodLoggingLevel,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

export interface ApiGatewayConstructProps {
  appName: string
  stage: string
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: RestApi
  public readonly apiUrl: string

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id)

    const { appName, stage } = props

    // Create CloudWatch Log Group for API Gateway
    const logGroup = new LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/${appName}-${stage}`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy:
        stage === 'production' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })

    // Create REST API
    this.api = new RestApi(this, 'RestApi', {
      restApiName: `${appName}-${stage}-api`,
      description: `${appName} REST API for ${stage} environment`,
      deployOptions: {
        stageName: stage,
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new LogGroupLogDestination(logGroup),
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
      },
      cloudWatchRole: true,
    })

    // Set API URL
    this.apiUrl = this.api.url
  }
}
