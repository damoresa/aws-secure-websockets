'use strict';

require('dotenv').config();
const axios = require('axios');
const WebsocketClient = require('websocket').client;

// Websocket client configuration
const client = new WebsocketClient();

client.on('connectFailed', (error) => {
    console.error('Connection attempt failed', error);
    client.abort();
});
client.on('connect', (connection) => {
    console.log('Connected!');
    connection.on('error', (error) => {
        console.error('Error during connection', error);
        connection.close();
    });
    connection.on('close', () => {
        console.log('Connection closed!');
    });
    connection.on('message', (message) => {
        const content = JSON.parse(message.utf8Data);
        switch (content.action) {
            case 'PING':
                console.log('Keeping alive');
                break;
            case 'GREETING':
                console.log(content.value);
                break;
            default:
                console.error('Unsupported response', content);
        }
    });

    // Websockets usually timeout and close automatically after being
    // idle for around a minute. This ping/pong implementation keeps
    // the socket alive.
    const ping = () => {
        if (connection.connected) {
            // console.log('Pinging!');
            const pingMessage = {
                action: 'PING'
            };
            connection.sendUTF(JSON.stringify(pingMessage));
            setTimeout(ping, 30000);
        }
    };

    const scheduledMessage = () => {
        if (connection.connected) {
            console.log('Greeting everyone!');
            const greetingMessage = {
                action: 'GREETING',
                message: `Hello everyone, this is instance ${instance}`
            };
            connection.sendUTF(JSON.stringify(greetingMessage));
            setTimeout(scheduledMessage, 5000);
        }
    };

    ping();
    if (greets) {
        scheduledMessage();
    }
});

// Process configuration and execution
// Connection metadata: API Websocket host address and Cognito user auth :)

const authHost = process.env.AUTH_ENDPOINT;
const host = process.env.WS_HOST;
const authData = {
    user: process.env.USERNAME,
    password: process.env.PASSWORD
};

if (process.argv.length < 4) {
    console.error('ERROR: Client identifier and event must be provided');
    console.error('Command has the following pattern: node index.js <client-id> <event> <isPulisher>');
    console.error();
    console.error('Example usages:');
    console.error('\t- Listener only:');
    console.error('\t\tnode index.js first-listener greeting');
    console.error('\t\tnode index.js first-listener greeting false');
    console.error('\t- Listener publisher:');
    console.error('\t\tnode index.js second-listener greeting true');
    process.exit(1);
}

const instance = process.argv[2];
const event = process.argv[3];
const greets = process.argv.length > 4 ? process.argv[4] : false;

// Retrieve the access token
axios.post(authHost, authData)
    .then((response) => {
        const loginData = response.data;
        console.log(`Generated token for user ${loginData.user}`);

        // This old token cause sa signature verification failed at CloudWatch
        // loginData.token = 'eyJraWQiOiJBSnlTb0ZuVVk3WlBVVVhMSG5DMnZWMXJmXC9TZ3RsaHYyTHN1Z3lrem5GMD0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIyZjZmNmJkZi1jZDBiLTQ0NmYtYWMyNC1kZGEwM2RjN2UwMGQiLCJhdWQiOiIxNXJhZjQ1cWxrNTVjM2pjZ2dnYzI2aXR0NiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6Ijc5MTA4ZjZkLTFhZGItNDhiYy05NTg4LThiNzUxZTRlZTk5ZiIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNTYzOTgzNTkzLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuZXUtY2VudHJhbC0xLmFtYXpvbmF3cy5jb21cL2V1LWNlbnRyYWwtMV9vT25vM1JrN04iLCJjb2duaXRvOnVzZXJuYW1lIjoiZGFtb3Jlc2EiLCJleHAiOjE1NjM5ODcxOTMsImlhdCI6MTU2Mzk4MzU5MywiZW1haWwiOiJkYW5pZWwuYW1vcmVzLmFsdmFyZXpAZXZlcmlzLmNvbSJ9.HPeiTBDwiZd-6Oe7OnyaEZjfEL5in4u1GqxtiA2mhF7aCoqZDDLqanicrRLW3M0x4xV3IdivwD5MdPE-T0WCts60pdnxIBKDBvajehLT-lrWdDv-7SKDXrgaYA4-ZuAmqcrmEN3NgTIVfXB5sMVkeahWAXnPPBiSdGDSCVdrYXTTmM-R8y0TQrAqp38x6u5pfpYmIktEnWqbafoU36nDlRxGBdt9dJ_Esm3Dux05MeILcoYBbo741uXNgsk3qr4pOF-4t0A8TiNSccsyFoSdqFy7B06CsHLckRSIcJQow4Vnn3Ojtg-GYrEuXzeOj8Ydlx-Yb9kvp451_LRMM3NuGQ","refresh":"eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.gHEqD6XveeyAx-Hqf_pJa-lT0jw-VzFStL8KS2szG5_WbEOFXqpi6lkciQDOczuCfRXHpwmfC8gESdz-BDxYDXvM18N0lWj5Ro-0v9LtJ2zOntZqYyclb-Z6Kr0HYFlAw3R3seBC2lUx37DKasrlsDhMyu1-n3JMth8D3uvjPxmduDu3XRxUdSG07qGyc2nagUU9846vd67cA1fPzgoi6rdHb-dK-yqF_XKqYI5cMIOslB7Enx8rcWlZOplmB_VJHM1DBFSAW2xjWiSWSwrNxNnODln8b8cXEk0nOmOpQj6bW0LSHu0pmNFvP3-OId84oCqpF6GV3uAWENiG5SO6UA.DR_yq8TlySkdRjPl.2LYsjn7qhQAYJxtFm862EklbL-DUd7Uc6f9r69UqpaGnRccsZ6IKxSHW4WS3nr-9Q-_Lk5LWDgNPAymdSV9Pj0OtBXDMrktjGukffpDKcr5-Kiqk9vcGvC0ylYWcapHvZSwi8wj8qLawsVhgmIULh-34w9NxX6EPTFwFNc5nZEoZkcCsfTw3IEIinE_ulTNJdfkwpMdvndx9X0-XwKtu7946H1NGJ2XJWZxLhmrSuTHwIjnu8JFBLcYb44SlDj36yv25rOW3Sx-z0AN0HRoW_Brs1tcLonmtkar7Fz9F2XDZVqytJf4HmulSI8ex6WXvO22fHP9ZJAc32r3K455i2llBftgtcOse_WdInr-6_BHZlKOAncCdlLkIpoyAMy2U5xWTYAiIiD4Up24inzh60wQgfaQqcTmDymW7avXAqTAxnr2y34atU0-nMmYifBEuaKIakzvaNXXrUgZFejDKlw2oPc1PY5yIxr63USv3iqLIxaDkmbqU43jq87EVQyl454jaM-eVL-iJvjpZBwxOoCQLCCw4YakRnxt5y7Bbtk0itpUfIEkoGjdkRveMm0gDwolF3LHAvEdNPEXiz6MDr9uWNEijBxvBI42afBv2BIjxfYKeC71BERaMXaV8nAJA2wsC2VFueX2YJLLVbLLnB_uYf6Eb84xKsABlYI__yHYxPrulT2_rwMufmE1Sa12qrNQFl3PeqhY9pqyBXLhogF-0iuMPg2y2b80co0sh2NVvHzAngNg45rOYPPbMCVpg7x65ypAXkf9XK7pIuAl4EzmTbn_KJGQHnY1hDuzdnPdLQ_3GgiaQSXldCT7scxFNchJleR3VWtd9tYtwl8TgKowFOHmn0-knAjgzH4QkA-Wwf4EEe9EuT5hUDdOIK4CFEMx9-qEGeGkOhzr8xb4cb82nddZU5jBzFGL5FKSY2h_RWGbGuffgpORq8GZN_OX665iJMQoXyC37mfCiZ3s2wj9ygzhzTgPUVQ-fbN0G9-aioL6DnYHk4uiuPylTn5MZeWtRY7qW8lpaz5QsexPy8rNxHMl43yBToaxPcddKBKdEVVgc_jp2a8U4kaS8Ea-lBwYH9yzHYwVOqm8xXNHHHVit-FfDN60-s2YmhDClCzmVWR7VaFEem_LTWhhHH3urPnkVRXutdl-SEV4AaKF7wdMUSGRoERQPxmVhKbhVooQiTZuDWc0SUsAKouB-B-r_BjmHZmlzOwVQVw_hZSCept_hLtmXXv7PEIhyBR1zHnOPPHsM8s4KYFjP-Ls5pZpWieO1IZwU2rGq-MSXZmEM.ie2DRoTujV4tGJO5xXtJEg';

        // Use the retrieved access token to connect to the socket.
        // If Authorizer is not added to the request, server delivers a 401 response.
        // If an invalid Authorizer is added, server delivers a 500 response
        client.connect(`${host}?connectionType=${event}&Authorizer=${loginData.token}`);

    })
    .catch((err) => {
        console.error('Unable to initialize socket connection', err.toString());
    });
