var nodemailer = require('nodemailer');
var sendmailTransport = require('nodemailer-sendmail-transport');

var mailer = nodemailer.createTransport(sendmailTransport({

}));

module.exports = mailer;