'use strict';

const aws = require('aws-sdk');

const CONSTANTS = require('./../constants');
const dynamodbConnector = require('./dynamodb.connector');

class ApiGatewayConnector {
    constructor() {
        const CONNECTOR_OPTS = {
            endpoint: CONSTANTS.WEBSOCKET_API_ENDPOINT
        };
        this._connector = new aws.ApiGatewayManagementApi(CONNECTOR_OPTS);
    }

    get connector() {
        return this._connector;
    }

    async generateSocketMessage(connectionId, data) {
        try {
            return await this._connector.postToConnection({
                ConnectionId: connectionId,
                Data: data
            }).promise();
        } catch (error) {
            console.error('Unable to generate socket message', error);
            if (error.statusCode === 410) {
                console.log(`Removing stale connector ${connectionId}`);
                await dynamodbConnector.removeSocket(connectionId);
            }
        }
    }
}

const APIGW_CONNECTOR = new ApiGatewayConnector();
module.exports = APIGW_CONNECTOR;
