# IPN2MQ
A basic middleware IPN listener/AMQP publisher script to stuff IPNs into RabbitMQ.

## Usage
1. Install dependencies (`npm i`)
2. Tweak the config file how you see fit (see [configuring](#configuring))
3. Start the app (`npm start` or `NODE_ENV=production node app.js`)

## Configuring
### IPN2MQ
A sample configuration file (`config.json`) is included in the repository. All fields are mandatory. It contains the following variables:
| Variable          | Default value        | Description                                 |
| ----------------- | -------------------- | ------------------------------------------- |
| `host`            | `"0.0.0.0"`          | Host address to bind the IPN listener to    |
| `post`            | `8080`               | Port to bind the IPN listener to            |
| `ipnCallbackPath` | `"/paypal/"`         | Path that the IPN listener will listen at   |
| `paypalEmail`     | `""`                 | Recipient email to filter IPNs by. Any IPN for a payment sent to a different email will be ignored. Leave the string empty to disable this feature. |
| `brokerUrl`       | `"amqp://localhost"` | Address of the RabbitMQ broker              |
| `exchange`        | `"amq.topic"`        | Exchange to publish reformatted IPN data to |
| `routingKey`      | `"request"`          | Routing key for the exchange                |

### PayPal
PayPal will need to know where to send IPNs before it can actually send them. Configure the `ipnCallbackPath` as desired and refer to the [PayPal docs](https://developer.paypal.com/docs/api-basics/notifications/ipn/IPNSetup/) for registering the URL for IPNs.

## Docker
Build a docker image with:
```sh
docker build --tag ipn2mq:latest ./
```
and run it with:
```sh
docker run -d \
    --name ipn2mq \
    --mount type=bind,source=$(pwd)/config.json,target=/app/config.json \
    -p 8080:8080/tcp \
    ipn2mq
```
The bind to an external `config.json` is optional; it's just used it here for ease of configuration.

### Testing with the [IPN simulator](https://developer.paypal.com/developer/ipnSimulator/)
By default the container will run the app in production mode. To accept test IPNs and dump them in the terminal, set the `NODE_ENV` environment variable to `development` by adding the following option to the `docker run` command:
```
--env NODE_ENV=development
```
Setting the `NODE_ENV` variable to any other value will default to production mode.
