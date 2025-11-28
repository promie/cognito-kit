#!/usr/bin/env node
import 'source-map-support/register'
import { App, StackProps } from 'aws-cdk-lib'
import { CognitoKitStack } from './stacks/cognito-kit/stack'

const {
  CDK_DEPLOY_ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT,
  CDK_DEPLOY_REGION = process.env.CDK_DEFAULT_REGION,
  APP_NAME = 'CognitoKit',
  STAGE = process.env.NODE_ENV || 'staging',
} = process.env

const baseProps: StackProps = {
  env: {
    account: CDK_DEPLOY_ACCOUNT,
    region: CDK_DEPLOY_REGION,
  },
}

const app = new App()

new CognitoKitStack(app, 'CognitoKitStack', {
  ...baseProps,
  appName: APP_NAME,
  stage: STAGE,
})
