'use strict';

const aws = require('aws-sdk');

const CONSTANTS = require('./../constants');

class DynamoDbConnector {
    constructor() {
        this._connector = new aws.DynamoDB.DocumentClient(CONSTANTS.DYNAMODB_OPTIONS);
    }

    get connector() {
        return this._connector;
    }

    async findSocketsBySubscription(subscription) {
        const queryParams = {
            TableName: CONSTANTS.DYNAMODB_SOCKETS_TABLE,
            IndexName: CONSTANTS.DYNAMODB_SOCKETS_TYPE_GSI,
            KeyConditionExpression: '#type = :type',
            ExpressionAttributeNames: {
                '#type': 'type',
            },
            ExpressionAttributeValues: {
                ':type': subscription
            }
        };

        return await this._connector.query(queryParams).promise();
    }

    async registerSocket(connectionId, connectionType) {
        const socketParams = {
            TableName: CONSTANTS.DYNAMODB_SOCKETS_TABLE,
            Item: {
                connectionId,
                type: connectionType
            }
        };

        return await this._connector.put(socketParams).promise();
    }

    async removeSocket(connectionId) {
        const socketParams = {
            TableName: CONSTANTS.DYNAMODB_SOCKETS_TABLE,
            Key: {
                connectionId
            }
        };

        return await this._connector.delete(socketParams).promise();
    }
}

const DYNAMODB_CONNECTOR = new DynamoDbConnector();
module.exports = DYNAMODB_CONNECTOR;
