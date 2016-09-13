var mailer = require('../../util/mailHelper.js');

exports.sendTestingMail = function(address,callback) {
	var mailOptions = {
	    from: '<noreply@xingyunzh.com>', 
	    to: address, // list of receivers
	    subject: '这是一封测试邮件', // Subject line
	    html: 'Hello world ！     <p> 这是一封用nodejs的nodemailer发送的测试邮件。</p> '
	};

	mailer.sendMail(mailOptions,callback);
}

exports.sendActivateCode = function(address,code,callback) {
	var mailOptions = {
	    from: '<noreply@xingyunzh.com>', 
	    to: address, // list of receivers
	    subject: '激活码', // Subject line
	    text:'激活码为：' + code
	    //html: 'Hello world ！     <p> 这是一封用nodejs的nodemailer发送的测试邮件。</p> '
	};

	mailer.sendMail(mailOptions,callback);
}