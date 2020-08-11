// Derived from 'rabbitmq-initconnection.js' and 'rabbitmq-publisher.js' written
// by Rafael Guzman.
// Obtained from https://gist.github.com/rguzmano/1dcfda90b5872bd5ced66d2d9b865719
// and https://gist.github.com/rguzmano/7b6fbc04dc9b5da6d850d09c2fb353a8
// on Aug 17, 2020 at 08:17 UTC
const amqp = require('amqplib/callback_api');

let amqpConn = null;
let pubChannel = null;
module.exports = {
    InitConnection: (brokerUrl, onConnected) => {
        // Connect to the broker
        amqp.connect(brokerUrl, (err, conn) => {
            // Report connection failure and retry if necessary
            if (err) {
                console.error("[AMQP] ", err.message);
                return setTimeout(this, 1000);
            }

            // Handle general connection errors
            conn.on("error", function(err) {
                console.log("ERROR", err);
                if (err.message !== "Connection closing") {
                    console.error("[AMQP] Connection error", err.message);
                }
            });

            // Handle connection closure
            conn.on("close", function() {
                // Reconnect when connection was closed
                console.error("[AMQP] Reconnecting");
                return setTimeout(() => { module.exports.InitConnection(brokerUrl, onConnected) }, 1000);
            });

            // Report connection established and store it for later
            console.log("[AMQP] Connected");
            amqpConn = conn;

            // Run callback
            onConnected();
        });
    },
    OpenChannel: () => {
        // Open up a new channel with publisher confirms enabled
        amqpConn.createConfirmChannel(function(err, channel) {
            // Report channel opening failure and close the connection
            if (err) {
                console.error("[AMQP] ", err.message);
                amqpConn.close();
                return;
            }

            // Handle general channel errors
            channel.on("error", function(err) {
                console.error("[AMQP] Channel error", err.message);
            });

            // Handle channel closure
            channel.on("close", function() {
                console.log("[AMQP] Channel closed");
            });

            // Report channel opened and store it for later
            console.log("[AMQP] Publisher started");
            pubChannel = channel;
        });
    },
    PublishMessage: (exchange, routingKey, content, options = {}) => {
        // Make sure the channel is available
        if (!pubChannel) {
            console.error("[AMQP] Cannot publish message, channel is not open. Open it with OpenChannel.");
            return;
        }

        try {
            // Publish the message to the exchange
            pubChannel.publish(exchange, routingKey, Buffer.from(content, "utf-8"), options, (err) => {
                if (err) {
                    console.error("[AMQP] Publish error", err);
                    pubChannel.connection.close();
                    return;
                }

                console.log("[AMQP] Published message");
            });
        } catch (e) {
            console.error("[AMQP] Publish error", e.message);
        }
    }
};
