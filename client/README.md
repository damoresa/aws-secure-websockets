## AWS Secure Websocket client

Secured _web socket_ client implemented using [websocket].

### Configuration

This client uses [dotenv] to manage credentials and URLs.
The following environment variables must be declared in a 
_.env_ file at the root of the client project:

1. _AUTH_ENDPOINT_: _lambda_ service endpoint used to 
create the _JWT_ token to be used as identity.
1. _WS_HOST_: _API Gateway WebSocket_ endpoint which 
exposes the _web socket_ server.
1. _USERNAME_: username created at _AWS Cognito_. It'll 
be used in order to generate the _JWT_ token used to 
validate the user identity.
1. _PASSWORD_: user's password as set at _AWS Cognito_.

### Running it!

In order to run the client you must specify:

* Client identifier you'd like to use.
* Event you're subscribing to.
* Whether you want to deliver test messages or not.

Examples:

```bash
# Example pattern
$ node index.js <client-id> <event> <true/false>

# Listener only:
node index.js first-listener greeting
node index.js first-listener greeting false

# Listener publisher:
node index.js second-listener greeting true
```


[dotenv]: https://www.npmjs.com/package/dotenv
[websocket]: https://www.npmjs.com/package/websocket
