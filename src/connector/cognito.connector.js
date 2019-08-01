'use strict';

// AWS Cognito Identity is only meant for browser usage apparently...
// As a workaround, install and load fetch as global..
// https://github.com/aws-amplify/amplify-js/issues/403
global.fetch = require('node-fetch');
const cognitosdk = require('amazon-cognito-identity-js');

const CONSTANTS = require('./../constants');

const getTokens = (authResult) => {
    // According to the official docs, in order to authenticate via API GW
    // you don't use the access token but the token id instead.
    // https://docs.aws.amazon.com/en_en/cognito/latest/developerguide/using-amazon-cognito-user-identity-pools-javascript-examples.html
    const accessToken = authResult.getAccessToken().getJwtToken();
    const refreshToken = authResult.getRefreshToken().getToken();
    const tokenId = authResult.getIdToken().getJwtToken();

    return {
        accessToken,
        refreshToken,
        tokenId
    };
};

const authenticate = (cognitoUser, authenticationDetails) => {
    return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
                // Authenticate a user section
                resolve(getTokens(result));
            },
            newPasswordRequired: function (userAttributes, requiredAttributes) {
                // User was signed up by an admin and must provide new
                // password and required attributes, if any, to complete
                // authentication.
                // This is not production ready and should be managed by the user
                // on production environments.C

                // the api doesn't accept this field back
                delete userAttributes.email_verified;

                // unsure about this field, but I don't send this back
                delete userAttributes.phone_number_verified;

                // Get these details and call
                cognitoUser.completeNewPasswordChallenge(
                    authenticationDetails.getPassword(),
                    userAttributes,
                    this
                );
            },
            onFailure: (error) => {
                reject(error);
            }
        });
    });
};

const refresh = (cognitoUser, token) => {
    return new Promise((resolve, reject) => {
        cognitoUser.refreshSession(token, (err, session) => {
            if (err) {
                reject(err);
            } else {
                resolve(getTokens(session));
            }
        });
    });
};

class CognitoConnector {
    constructor() {
        const poolData = {
            UserPoolId: CONSTANTS.COGNITO_USER_POOL,
            ClientId: CONSTANTS.COGNITO_USER_POOL_CLIENT
        };
        this._userPool = new cognitosdk.CognitoUserPool(poolData);
    }

    async authenticateUser(user, password) {
        // 1. Generate an AuthenticationDetails object
        const authenticationData = {
            Username: user,
            Password: password
        };
        const authenticationDetails =
            new cognitosdk.AuthenticationDetails(authenticationData);

        // 2. Generate a CognitoUser object
        const userData = {
            Username: user,
            Pool: this._userPool
        };
        const cognitoUser = new cognitosdk.CognitoUser(userData);

        // 3. Invoke the authenticate method
        return await authenticate(cognitoUser, authenticationDetails);
    }

    async refreshToken(user, token) {
        // 1. Generate a CognitoUser object
        const userData = {
            Username: user,
            Pool: this._userPool
        };
        const cognitoUser = new cognitosdk.CognitoUser(userData);

        // 2. Generate a RefreshToken object
        const refreshToken = new cognitosdk.CognitoRefreshToken({RefreshToken: token});
        console.log(refreshToken);
        console.log(refreshToken.getToken());

        // 3. Invoke the refresh method
        return await refresh(cognitoUser, refreshToken);
    }
}

const COGNITO_CONNECTOR = new CognitoConnector();
module.exports = COGNITO_CONNECTOR;
