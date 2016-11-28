init();

function init(){
	$('#inputEmail').blur(function() {
		checkEmail();
	});

	$('#inputPassword').blur(function(){
		checkPassword();
	});

	$('#inputSubmit').click(function(){
		doSignup();
	});
}

function checkEmail(){
	var email = $('#inputEmail').val();

	if (!email) {
		$('#tipsEmail').text(Messages.noEmail);
		return false;
	}else if(isEmail()){
		$('#tipsEmail').text(Messages.invalidEmail);
		return false;
	}else{
		return true;
	}
	
}

function checkPassword(){
	var password = $('#inputPassword').val();

	if (!password) {
		$('#tipsPassword').text(Messages.noPassword);
		return false;
	}else{
		return true;
	}
}

function doSignup(){
	if (checkEmail()&&checkPassword()) {
		var email = $('#inputEmail').val();
		var password = $('#inputPassword').val();

		var settings = {
			type:'POST',
			url:'/clduser/register',
			data:JSON.stringify({
				email:email,
				password:password
			}),
			contentType:'application/json'
		};

		$.ajax(settings).done(function(res){
			console.log('OK',res);
		}).fail(function(err){
			console.log('err',err);
		});
	}
}

function isEmail() {
	var email = $('#inputEmail').val();

 	var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  	return regex.test(email);
}

var Messages = {
	noPassword:'请输入密码',
	noEmail:'请输入邮箱',
	invalidEmail:'请输入正确的邮箱'
};

