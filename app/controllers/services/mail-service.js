var mailer = require('../../util/mailHelper.js');

exports.sendTestingMail = function(callback) {
	var mailOptions = {
	    from: '<noreply@xingyunzh.com>', 
	    to: '110681032@qq.com', // list of receivers
	    subject: '这是一封测试邮件', // Subject line
	    html: 'Hello world ！     <p> 这是一封用nodejs的nodemailer发送的测试邮件。</p> '
	};

	mailer.sendMail(mailOptions,callback);
}