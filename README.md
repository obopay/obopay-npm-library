# Obopay node.js Communication Client

Current protocol version : v2

## Prequisites

To use the Obopay REST APIs, the client will have to register with Obopay. During the registration process, the client will get a unique client id, Obopay server host name, Obopay server port and Obopay server public key (for data encryption in the API request / response). The client will also have to provide their certficate and / or public key (for data encryption in the API request / response), and their ip from which the Obopay API will be hit. After registration, Obopay will provide a list of APIs, giving their respective name and param / response type with examples.

## Installation

Install **node-communication-client** using the following command in your node project.

	npm install git+https://github.com/obopay/node-communication-client.git

## Usage

Import the Obopay REST client (**ObopayClient**) as follows.

	const obopayClient = require('@obopay/communication-client').ObopayClient


Initialize **ObopayClient** with the respective config values.

	const config = {
	                 clientId         : client id (given by obopay)
	                 clientPrivateKey : client private key (required for encryption)
	                 serverPublicKey  : server public key (given by obopay)
	                 serverHost       : host name of the server (given by obopay)
	                 serverPort       : port on which the server is listening (optional) (given by obopay)
	               }

	obopayClient.init(config)

Use the **obopayApi** function in **ObopayClient** to call the API.

	const apiName = api name,
          params  = api params json object

	obopayClient.obopayApi(apiName, params).then((result) => {
		// do something with result
	})

Although **ObopayClient** is not very resource intensive and stopping the respective node process will also kill it, it is a good practice to stop the **ObopayClient** resources gracefully. Use **closeResources** to close **ObopayClient** resources.

	obopayClient.closeResources()

To initialize  **ObopayClient** again, we have to close **ObopayClient** resources and then call init the second time.

	obopayClient.init(config)
	obopayClient.init(newConfig)	// will throw error

	obopayClient.init(config)
	obopayClient.closeResources()
	obopayClient.init(newConfig)	// no problem


### Response Result

The json response result from **ObopayClient** will be of the following structure.

    {
      error   : null OR error-code
                // Messages are for debugging, must not be displayed to user
      data    : response data OR error-message
                // empty object body or absense indicates no data
	}

### Logging

By default the **ObopayClient** will log data in the **obopay-logs** directory date-wise. Logger can be initialized in the **init** function or **initLogger** function.

	const loggerConfig = {
                           logLevel     : 'NONE' | 'ERROR' | 'DEBUG' | 'CONSOLE' 	// default is 'DEBUG'
                           writeStream  : optional
                         }

	obopayClient.init(config, loggerConfig)
		OR
	obopayClient.initLogger(loggerConfig)

For logLevel **NONE**, no logs will be kept.

For logLevel **ERROR**, error logs will be kept.

For logLevel **DEBUG**, debug and error logs will be kept.

For logLevel **CONSOLE**, debug and error logs will print to console and will be stored as well.