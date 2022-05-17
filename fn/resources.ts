import { AttributeValue, DynamoDBClient, DynamoDBServiceException } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  DeleteCommandInput,
  DeleteCommandOutput,
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
} from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { v4 as uuidv4 } from 'uuid'

const marshallOptions = {
  convertEmptyValues: false,
  removeUndefinedValues: false,
  convertClassInstanceToMap: false,
}
const unmarshallOptions = {
  wrapNumbers: false,
}
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions, unmarshallOptions })

// UTILITY FUNCTIONS
function generateSuccessResponse(responseBody: any, statusCode?: number, data?: any): APIGatewayProxyResultV2 {
  const env = process.env.ENV
  if (data) console.log(data)
  statusCode = statusCode ?? 200
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...responseBody,
      ...(env != 'Production' && data && { data }),
    }),
  }
}

function generateErrorResponse(message: string, statusCode?: number, error?: unknown): APIGatewayProxyResultV2 {
  const env = process.env.ENV
  if (error) console.log(error)
  statusCode = statusCode ?? (error instanceof DynamoDBServiceException && error['$fault'] == 'server' ? 500 : 400)
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      ...(env != 'Production' &&
        error instanceof Error && { error: { name: error.name, message: error.message, stack: error.stack } }),
    }),
  }
}

// ENDPOINT HANDLERS
export const createResource: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2) => {
  try {
    console.log('Event', JSON.stringify(event))
    // Validate
    if (!process.env.TABLE_NAME) throw new Error('Provide table name in environment variable')
    const tableName = process.env.TABLE_NAME

    if (!process.env.TABLE_PARAMS) throw new Error('Provide table params in environment variable')
    const { keys } = JSON.parse(process.env.TABLE_PARAMS)

    const { headers, pathParameters, queryStringParameters, body } = event
    const item: any = (body && JSON.parse(body)) ?? {}
    let ConditionExpression = ''
    keys.forEach((key: any, idx: number) => {
      const keyName: any = key.name
      if (!key.configuredIn) item[keyName] = uuidv4()
      else {
        const keyLoc: keyof APIGatewayProxyEventV2 = key.configuredIn
        if (keyLoc == 'headers') item[keyName] = headers[keyName] ?? ''
        else if (keyLoc == 'pathParameters') item[keyName] = (pathParameters && pathParameters[keyName]) ?? ''
        else if (keyLoc == 'queryStringParameters')
          item[keyName] = (queryStringParameters && queryStringParameters[keyName]) ?? ''
      }
      if (!item[keyName]) throw new Error('Provide key in event')
      else if (!idx) ConditionExpression = `attribute_not_exists(${keyName})`
      else ConditionExpression += ` AND attribute_not_exists(${keyName})`
    })

    // Process
    const input: PutCommandInput = {
      TableName: tableName,
      Item: item,
      ConditionExpression,
    }
    console.log(input)
    const data: PutCommandOutput = await client.send(new PutCommand(input))
    return generateSuccessResponse(item, 201, data)
  } catch (error: unknown) {
    return generateErrorResponse('Error creating resource', undefined, error)
  }
}

export const updateResource: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2) => {
  try {
    console.log('Event', JSON.stringify(event))
    // Validate
    if (!process.env.TABLE_NAME) throw new Error('Provide table name in environment variable')
    const tableName = process.env.TABLE_NAME

    if (!process.env.TABLE_PARAMS) throw new Error('Provide table params in environment variable')
    const { keys } = JSON.parse(process.env.TABLE_PARAMS)

    const { headers, pathParameters, queryStringParameters, body } = event
    const item: any = (body && JSON.parse(body)) ?? {}
    let ConditionExpression = ''
    keys.forEach((key: any, idx: number) => {
      const keyName: any = key.name
      if (!key.configuredIn) item[keyName] = uuidv4()
      else {
        const keyLoc: keyof APIGatewayProxyEventV2 = key.configuredIn
        if (keyLoc == 'headers') item[keyName] = headers[keyName] ?? ''
        else if (keyLoc == 'pathParameters') item[keyName] = (pathParameters && pathParameters[keyName]) ?? ''
        else if (keyLoc == 'queryStringParameters')
          item[keyName] = (queryStringParameters && queryStringParameters[keyName]) ?? ''
      }
      if (!item[keyName]) throw new Error('Provide key in event')
      else if (!idx) ConditionExpression = `attribute_exists(${keyName})`
      else ConditionExpression += ` AND attribute_exists(${keyName})`
    })

    // Process
    const input: PutCommandInput = {
      TableName: tableName,
      Item: item,
      ConditionExpression,
    }
    console.log(input)
    const data: PutCommandOutput = await client.send(new PutCommand(input))
    return generateSuccessResponse(item, 200, data)
  } catch (error: unknown) {
    return generateErrorResponse('Error updating resource', undefined, error)
  }
}

export const getResource: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2) => {
  try {
    console.log('Event', JSON.stringify(event))
    // Validate
    if (!process.env.TABLE_NAME) throw new Error('Provide table name in environment variable')
    const tableName = process.env.TABLE_NAME

    if (!process.env.TABLE_PARAMS) throw new Error('Provide table params in environment variable')
    const { keys } = JSON.parse(process.env.TABLE_PARAMS)

    const { headers, pathParameters, queryStringParameters, body } = event
    const item: any = (body && JSON.parse(body)) ?? {}
    const Key: { [key: string]: AttributeValue } = {}
    keys.forEach((key: any) => {
      const keyName: any = key.name
      if (!key.configuredIn) item[keyName] = uuidv4()
      else {
        const keyLoc: keyof APIGatewayProxyEventV2 = key.configuredIn
        if (keyLoc == 'headers') item[keyName] = headers[keyName] ?? ''
        else if (keyLoc == 'pathParameters') item[keyName] = (pathParameters && pathParameters[keyName]) ?? ''
        else if (keyLoc == 'queryStringParameters')
          item[keyName] = (queryStringParameters && queryStringParameters[keyName]) ?? ''
      }
      if (!item[keyName]) throw new Error('Provide key in event')
      else Key[keyName] = item[keyName]
    })

    // Process
    const input: GetCommandInput = {
      TableName: tableName,
      Key,
    }
    const data: GetCommandOutput = await client.send(new GetCommand(input))
    if (data.Item) return generateSuccessResponse(data.Item, 200, data)
    else return generateErrorResponse('Resource not found', 404)
  } catch (error: unknown) {
    return generateErrorResponse('Error retrieving resource', undefined, error)
  }
}

export const deleteResource: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2) => {
  try {
    console.log('Event', JSON.stringify(event))
    // Validate
    if (!process.env.TABLE_NAME) throw new Error('Provide table name in environment variable')
    const tableName = process.env.TABLE_NAME

    if (!process.env.TABLE_PARAMS) throw new Error('Provide table params in environment variable')
    const { keys } = JSON.parse(process.env.TABLE_PARAMS)

    const { headers, pathParameters, queryStringParameters, body } = event
    const item: any = (body && JSON.parse(body)) ?? {}
    const Key: { [key: string]: AttributeValue } = {}
    keys.forEach((key: any) => {
      const keyName: any = key.name
      if (!key.configuredIn) item[keyName] = uuidv4()
      else {
        const keyLoc: keyof APIGatewayProxyEventV2 = key.configuredIn
        if (keyLoc == 'headers') item[keyName] = headers[keyName] ?? ''
        else if (keyLoc == 'pathParameters') item[keyName] = (pathParameters && pathParameters[keyName]) ?? ''
        else if (keyLoc == 'queryStringParameters')
          item[keyName] = (queryStringParameters && queryStringParameters[keyName]) ?? ''
      }
      if (!item[keyName]) throw new Error('Provide key in event')
      else Key[keyName] = item[keyName]
    })

    // Process
    const input: DeleteCommandInput = {
      TableName: tableName,
      Key,
    }
    const data: DeleteCommandOutput = await client.send(new DeleteCommand(input))
    return generateSuccessResponse({ message: 'Deleted resource' }, 200, data)
  } catch (error: unknown) {
    return generateErrorResponse('Error deleting resource', undefined, error)
  }
}
