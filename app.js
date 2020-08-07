// Config variables
var config = require('./config.json');

// Node module imports
var express = require('express');
var ipn = require('express-ipn');

// Node module instantiation
var app = express();

// Express middleware config
// ...none

// Express routes
// Process PayPal Instant Payment Notifications from donations
app.post('/paypal/donation', ipn.validator((err, content) => {
    // Check if the IPN failed validation
    if (err) {
        console.error(err);
        return;
    }

    // Get the details
    var donorId = content.custom ? content.custom : 0;
    var amount = content.mc_gross;
    var fee = content.mc_fee;
    var timestamp = Math.floor(Date.now()/1000); // Epoch in seconds

    // TODO: Stuff this into Rabbit

}, true)); // Production mode?

// Start the app
app.listen(config['port']);
console.log('Express server listening on port %d in %s mode', config['port'], app.settings.env);
