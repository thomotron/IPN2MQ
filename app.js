// Config variables
const config = require('./config.json');

// Node module imports
const express = require('express');
const ipn = require('express-ipn');
const amqp = require('amqplib/callback_api');
const mqWrapper = require('./amqpWrapper.js');

// Node module instantiation
var app = express();

// Express middleware config
// ...none

// Express routes
// Process PayPal Instant Payment Notifications from donations
app.post(config['ipnCallbackPath'], ipn.validator((err, content) => {
    // Check if the IPN failed validation
    if (err) {
        console.error(err);
        return;
    }


    // Get the details
    let donorId = content.custom ? content.custom : null;
    let amount = content.mc_gross;
    //let fee = content.mc_fee;
    //let timestamp = Math.floor(Date.now()/1000); // Epoch in seconds
    let name = content.first_name // TODO: Use something else (i.e. donorId)
    let email = content.payer_email

    // Format a message and queue it
    let message = {
        type: "donation",
        crud: "create",
        payload: {
            name: name,
            email: email,
            amount: amount,
            comments: "" // Leave blank
        }
    };
    mqWrapper.PublishMessage(config['exchange'], config['routingKey'], JSON.stringify(message));
}, true)); // Production mode?

// Connect to Rabbit
mqWrapper.InitConnection(config['brokerUrl'], () => {
    mqWrapper.OpenChannel();
});

// Start the app
app.listen(config['port']);
console.log('[WEB] Express server listening on port %d in %s mode', config['port'], app.settings.env);
