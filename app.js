// Config variables
const config = require('./config.json');
const isDevMode = process.env.NODE_ENV === 'development';

// Node module imports
const express = require('express');
const ipn = require('express-ipn');
const amqp = require('amqplib/callback_api');
const mqWrapper = require('./amqpWrapper.js');
const bodyParser = require('body-parser');

// Node module instantiation
var app = express();

// Express middleware config
app.use(bodyParser.urlencoded({extended: false}));

// Express routes
// Process PayPal Instant Payment Notifications from donations
app.post(config['ipnCallbackPath'], ipn.validator((err, content) => {
    // Check if the IPN failed validation
    if (err) {
        console.error(err);
        return;
    }

    // Dev-only: Dump the IPN to the terminal
    if (isDevMode) console.log(content);

    // Get the details
    let donorId = content.custom ? content.custom : null;
    let amount = content.mc_gross;
    let email = content.payer_email

    // Make sure the payment is addressed to our PayPal email (if enabled)
    // before moving on, ignoring it otherwise.
    // This should prevent abuse of the callback URL with another payee.
    if (config['paypalEmail'] && content.receiver_email !== config['paypalEmail']) {
        console.log('[WEB] Got a payment addressed to %s instead of %s - ignoring. This could be malicious behaviour.', content.receiver_email, config['paypalEmail']);
        return;
    }

    // Make sure the payment is complete before lodging the donation
    // Otherwise just ignore it, another IPN will be sent once it clears
    if (content.payment_status !== 'Completed') {
        console.log('[WEB] Got an incomplete payment (%s) with transaction ID %s - not lodging donation yet', content.payment_status, content.txn_id);
        return;
    }

    console.log('[WEB] Got a completed payment with transaction ID %s', content.txn_id);

    // Format a message and queue it
    let message = {
        type: "donation",
        crud: "create",
        payload: {
            name: donorId,
            email: email,
            amount: amount,
            comments: "" // Leave blank
        }
    };
    mqWrapper.PublishMessage(config['exchange'], config['routingKey'], JSON.stringify(message));
}, !isDevMode)); // Production mode?

// Connect to Rabbit
mqWrapper.InitConnection(config['brokerUrl'], () => {
    mqWrapper.OpenChannel();
});

// Start the app
app.listen(config['port'], config['host']);
console.log('[WEB] Express server listening on port %d in %s mode', config['port'], app.settings.env);
if (config['paypalEmail']) console.log('[WEB] Only accepting payments made to %s', config['paypalEmail']);
