import {
  AdminDeleteUserCommand,
  AdminDeleteUserCommandInput,
  AdminDeleteUserCommandOutput,
  AdminGetUserCommand,
  AdminGetUserCommandInput,
  AdminGetUserCommandOutput,
  AdminInitiateAuthCommand,
  AdminInitiateAuthCommandInput,
  AdminInitiateAuthCommandOutput,
  AdminUpdateUserAttributesCommand,
  AdminUpdateUserAttributesCommandInput,
  AdminUpdateUserAttributesCommandOutput,
  AdminUserGlobalSignOutCommand,
  AdminUserGlobalSignOutCommandInput,
  AdminUserGlobalSignOutCommandOutput,
  CognitoIdentityProviderClient,
  CognitoIdentityProviderServiceException,
  SignUpCommand,
  SignUpCommandInput,
  SignUpCommandOutput,
  UserStatusType,
} from '@aws-sdk/client-cognito-identity-provider'
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda'
const client = new CognitoIdentityProviderClient({})

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
  statusCode =
    statusCode ?? (error instanceof CognitoIdentityProviderServiceException && error['$fault'] == 'client' ? 400 : 500)
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

export const signIn: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2) => {
  try {
    // Validate
    if (!event.headers || !event.headers.authorization) throw new Error('Provide username and password')
    const encodedCreds = event.headers.authorization.split(' ')[1]
    if (!encodedCreds) throw new Error('Unauthorized')
    const [USERNAME, PASSWORD] = Buffer.from(encodedCreds, 'base64').toString().split(':')

    // Process
    const input: AdminInitiateAuthCommandInput = {
      UserPoolId: process.env.USER_POOL_ID,
      ClientId: process.env.CLIENT_ID,
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME,
        PASSWORD,
      },
    }
    const data: AdminInitiateAuthCommandOutput = await client.send(new AdminInitiateAuthCommand(input))
    const responseBody = {
      message: 'Signed in user',
      tokens: data.AuthenticationResult,
    }
    return generateSuccessResponse(responseBody, 201, data)
  } catch (error: unknown) {
    return generateErrorResponse('Error signing in user', undefined, error)
  }
}

export const signOut: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2) => {
  try {
    // Validate
    if (!event.headers || !event.headers.authorization) throw new Error('Provide username and password')
    const encodedCreds = event.headers.authorization.split(' ')[1]
    if (!encodedCreds) throw new Error('Unauthorized')
    const [Username] = Buffer.from(encodedCreds, 'base64').toString().split(':')

    // Process
    const input: AdminUserGlobalSignOutCommandInput = {
      UserPoolId: process.env.USER_POOL_ID,
      Username,
    }
    const data: AdminUserGlobalSignOutCommandOutput = await client.send(new AdminUserGlobalSignOutCommand(input))
    return generateSuccessResponse({ message: 'Signed out user' }, 201, data)
  } catch (error: unknown) {
    return generateErrorResponse('Error signing out user', undefined, error)
  }
}

export const createUser: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2) => {
  try {
    // Validate
    if (!event.body) throw new Error('Provide request body')
    const { email, password, fullname, phoneNumber, isAdmin } = JSON.parse(event.body)
    if (!email) throw new Error('Provide email in request body')
    if (!password) throw new Error('Provide password in request body')
    if (!fullname) throw new Error('Provide fullname in request body')
    if (!phoneNumber) throw new Error('Provide phoneNumber in request body')
    if (typeof isAdmin === undefined) throw new Error('Provide isAdmin in request body')

    // Process
    const input: SignUpCommandInput = {
      ClientId: process.env.CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'name', Value: fullname },
        { Name: 'phone_number', Value: phoneNumber },
        { Name: 'custom:isAdmin', Value: isAdmin ? 'true' : 'false' },
      ],
    }
    console.log(input)
    const data: SignUpCommandOutput = await client.send(new SignUpCommand(input))
    return generateSuccessResponse({ message: 'Registered user' }, 201, data)
  } catch (error: unknown) {
    return generateErrorResponse('Error registering user', undefined, error)
  }
}

export const updateUser: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2) => {
  try {
    console.log('Event', JSON.stringify(event))
    // Validate
    if (!event['pathParameters'] || !event['pathParameters']['id'])
      throw new Error('Provide verified email address in path parameter')
    const Username: string = event['pathParameters']['id']
    if (!event.body) throw new Error('Provide request body')
    const { fullname, phoneNumber, isAdmin } = JSON.parse(event.body)
    if (!fullname) throw new Error('Provide fullname in request body')
    if (!phoneNumber) throw new Error('Provide phoneNumber in request body')
    if (typeof isAdmin === undefined) throw new Error('Provide isAdmin in request body')
    const u: AdminGetUserCommandOutput = await client.send(
      new AdminGetUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username,
      }),
    )
    if (u.UserStatus != UserStatusType.CONFIRMED) throw new Error('Provide verified email address in path parameter')

    // Process
    const input: AdminUpdateUserAttributesCommandInput = {
      UserPoolId: process.env.USER_POOL_ID,
      Username,
      UserAttributes: [
        { Name: 'name', Value: fullname },
        { Name: 'phone_number', Value: phoneNumber },
        { Name: 'custom:isAdmin', Value: isAdmin ? 'true' : 'false' },
      ],
    }
    console.log(input)
    const data: AdminUpdateUserAttributesCommandOutput = await client.send(new AdminUpdateUserAttributesCommand(input))
    return generateSuccessResponse({ message: 'Updated user' }, 200, data)
  } catch (error: unknown) {
    return generateErrorResponse('Error updating user', undefined, error)
  }
}

export const getUser: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2) => {
  try {
    // Validate
    if (!event['pathParameters'] || !event['pathParameters']['id']) throw new Error('Provide user id as path parameter')
    const Username: string = event['pathParameters']['id']

    // Process
    const input: AdminGetUserCommandInput = {
      UserPoolId: process.env.USER_POOL_ID,
      Username,
    }
    const data: AdminGetUserCommandOutput = await client.send(new AdminGetUserCommand(input))
    const responseBody = {
      message: 'Retrieved user',
      user: {
        fullname: data.UserAttributes?.find((v) => v.Name == 'name')?.Value,
        phoneNumber: data.UserAttributes?.find((v) => v.Name == 'phone_number')?.Value,
        isAdmin: data.UserAttributes?.find((v) => v.Name == 'custom:isAdmin')?.Value == 'true' ? true : false,
        createdAt: data.UserCreateDate,
        updatedAt: data.UserLastModifiedDate,
        status: data.UserStatus,
        isEnabled: data.Enabled,
      },
    }
    return generateSuccessResponse(responseBody, 200, data)
  } catch (error: unknown) {
    return generateErrorResponse('Error retrieving user', undefined, error)
  }
}

export const deleteUser: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2) => {
  try {
    // Validate
    if (!event['pathParameters'] || !event['pathParameters']['id']) throw new Error('Provide user id as path parameter')
    const Username: string = event['pathParameters']['id']

    // Process
    const input: AdminDeleteUserCommandInput = {
      UserPoolId: process.env.USER_POOL_ID,
      Username,
    }
    const data: AdminDeleteUserCommandOutput = await client.send(new AdminDeleteUserCommand(input))
    return generateSuccessResponse({ message: 'Deleted user' }, 200, data)
  } catch (error: unknown) {
    return generateErrorResponse('Error deleting user', undefined, error)
  }
}
