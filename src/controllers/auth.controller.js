'use strict';

const fetch = require('node-fetch');
const jose = require('node-jose');

const cognitoConnector = require('./../connector/cognito.connector');

const CONSTANTS = require('./../constants');

// FIXME: I don't really feel like these fit in here as util functions, but they don't fit in a connector either...
const generatePolicy = function (principalId, effect, resource) {
    const authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        const policyDocument = {};
        // default version
        policyDocument.Version = "2012-10-17";
        policyDocument.Statement = [];
        const statementOne = {};
        // default action
        statementOne.Action = "execute-api:Invoke";
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    return authResponse;
};

const generateAllow = function (principalId, resource) {
    return generatePolicy(principalId, "Allow", resource);
};

const generateDeny = function (principalId, resource) {
    return generatePolicy(principalId, "Deny", resource);
};

const authUser = async (event, context) => {

    try {
        const data = JSON.parse(event.body);

        const user = data.user;
        const password = data.password;

        if (!user || !password) {
            const error = 'User and password must be provided for user authentication.';
            console.error(error);
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN
                },
                body: error
            }
        } else {
            const result = await cognitoConnector.authenticateUser(user, password);
            const response = {
                token: result.tokenId,
                refresh: result.refreshToken,
                user
            };

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN
                },
                body: JSON.stringify(response)
            }
        }
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN
            },
            body: 'Unable to authenticate user using AWS Cognito'
        }
    }
};

const authWebsocket = async (event, context) => {
    // Read input parameters from event
    const methodArn = event.methodArn;
    const token = event.queryStringParameters.Authorizer;

    if (!token) {
        return context.fail('Unauthorized');
    } else {
        // Get the kid from the headers prior to verification
        const sections = token.split('.');
        let header = jose.util.base64url.decode(sections[0]);
        header = JSON.parse(header);
        const kid = header.kid;

        // Fetch known valid keys
        const rawRes = await fetch(CONSTANTS.KEYS_URL);
        const response = await rawRes.json();

        if (rawRes.ok) {
            const keys = response['keys'];
            const foundKey = keys.find((key) => key.kid === kid);

            if (!foundKey) {
                context.fail('Public key not found in jwks.json');
            } else {
                try {
                    const result = await jose.JWK.asKey(foundKey);
                    const keyVerify = jose.JWS.createVerify(result);
                    const verificationResult = await keyVerify.verify(token);

                    const claims = JSON.parse(verificationResult.payload);

                    // Verify the token expiration
                    const currentTime = Math.floor(new Date() / 1000);
                    if (currentTime > claims.exp) {
                        console.error('Token expired!');
                        context.fail('Token expired!');
                    } else if (claims.aud !== CONSTANTS.COGNITO_USER_POOL_CLIENT) {
                        console.error('Token wasn\'t issued for target audience');
                        context.fail('Token was not issued for target audience');
                    } else {
                        context.succeed(generateAllow('me', methodArn));
                    }
                } catch (error) {
                    console.error('Unable to verify token', error);
                    context.fail('Signature verification failed');
                }
            }
        }
    }
};

const refreshToken = async (event, context) => {
    try {
        const data = JSON.parse(event.body);

        const user = data.user;
        const refresh = data.refresh;

        if (!user || !refresh) {
            const error = 'The user and token to be refreshed must be provided.';
            console.error(error);
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN
                },
                body: error
            }
        } else {
            const result = await cognitoConnector.refreshToken(user, refresh);
            const response = {
                token: result.tokenId,
                refresh: result.refreshToken,
                user: user
            };

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN
                },
                body: JSON.stringify(response)
            }
        }
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN
            },
            body: 'Unable to refresh user token using AWS Cognito'
        }
    }
};

module.exports = {
    authUser,
    authWebsocket,
    refreshToken
};
