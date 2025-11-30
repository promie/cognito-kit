import { Duration } from 'aws-cdk-lib'
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'
import { join } from 'path'
import { StandardLambda } from '../../../../common/StandardLambda'

export interface HealthConstructProps {
  appName: string
  api: RestApi
}

export class HealthConstruct extends Construct {
  public readonly lambda: StandardLambda

  constructor(scope: Construct, id: string, props: HealthConstructProps) {
    super(scope, id)

    const { appName, api } = props

    this.lambda = new StandardLambda(this, 'HealthFunction', {
      appName,
      entry: join(
        __dirname,
        '../../../../../app/handlers/health/health.handler.ts',
      ),
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(5),
    })

    // Add GET /health endpoint
    const healthResource = api.root.addResource('health')
    healthResource.addMethod('GET', new LambdaIntegration(this.lambda))
  }
}
