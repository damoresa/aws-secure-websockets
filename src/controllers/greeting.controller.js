'use strict';

const apigatewayConnector = require('./../connector/apigateway.connector');
const dynamodbConnector = require('./../connector/dynamodb.connector');
const CONSTANTS = require('./../constants');

const greeting = async (event, context) => {
    try {
        const connectionId = event.requestContext.connectionId;
        // Retrieve the message from the socket payload
        const data = JSON.parse(event.body);
        const greetingMessage = {
            action: data.action,
            value: data.message
        };

        // Allocate sockets subscribe to greetings
        const sockets = await dynamodbConnector.findSocketsBySubscription('greeting');
        if (sockets.Count > 0) {
            // Deliver a message to each subscriber found.
            // Filter our own connection to avoid notifying ourselves.
            const deliverableSockets = sockets.Items
                .filter((socket) => socket.connectionId !== connectionId);

            for (const socket of deliverableSockets) {
                // Handle errors for each message to avoid stopping if any error happens
                try {
                    await apigatewayConnector.generateSocketMessage(
                        socket.connectionId,
                        JSON.stringify(greetingMessage)
                    );
                } catch (err) {
                    console.error(`Unable to deliver message to ${socket.connectionId}`, err);
                }
            }
        } else {
            console.log('No sockets subscribed to greetings found.');
        }

        // Let the API Gateway Websocket know everything went OK.
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN
            },
            body: 'Greeting delivered.'
        };
    } catch (err) {
        // Notify API Gateway Websocket in case of error, also log it on
        // CloudWatch
        console.error('Unable to generate greeting', err);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN
            },
            body: 'Unable to generate greeting.'
        }
    }
};

module.exports = {
    greeting
};
