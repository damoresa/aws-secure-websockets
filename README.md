## AWS Secure Websocket

Secured _web socket_ deployed on _AWS_ infrastructure using 
the [serverless] framework.

This repository serves as an example for this 
[medium article]. Please, invest a few minutes reading it 
in case you need further detail.

All services have been implemented using [NodeJS].

### Serverless service user policies

_serverless_ documentation recommends creating a service user 
with restricted permissions in order to avoid security issues; 
for example, user leaking and having admin rights could be 
devastating for your _AWS_ bill.

However, the policies provided on the official example do not 
provide access to _AWS Cognito_. In order to use proper 
permissions, check the _sls-policies.json_ file within this 
repository.

### Infrastructure

The required _AWS_ infrastructure is as follows:

* _Lambda_: used to host our services.
* _API Gateway_: used to expose our services to the outer 
world. Also provides authentication using _AWS Cognito_ 
generated _JWT_ tokens.
* _API WebSocket_: used to expose our services as _near 
realtime connections_, allowing _bi directional_ communication.
It also helps us secure our connections using _AWS 
Cognito_ generated _JWT_ tokens.
* _DynamoDB_: used to track active _web socket_ connections 
and what they're subscribed to.
* _Cognito_: user pool which allows us create and validate 
user credentials.

### Deploying it

First of all, you need an _AWS_ account. Then it is 
mandatory to [configure serverless locally] with your 
credentials.

Once you've set your environment up, you can deploy the 
entire stack using the following command:
```bash
serverless deploy -v
```

In case you want to deploy an specific _lambda_, you can 
use this other command:
```bash
serverless deploy function -f <functionName> -v
```

You can also remove all the allocated resources by executing 
this command:
```bash
serverless remove -v
```

[medium article]: https://medium.com/@damoresac/implementing-secure-web-sockets-with-aws-api-gateway-cognito-dynamodb-and-lambda-b38e02314b42
[NodeJS]: https://nodejs.org/
[serverless]: https://serverless.com/
[configure serverless locally]: https://serverless.com/framework/docs/providers/aws/guide/credentials/
