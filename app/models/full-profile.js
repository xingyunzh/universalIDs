module.exports = exports = function FullProfile(user,userWechat){
	this._fullProfile = {
		userId:'',
		nickname:'',
		email:'',
		gender:''
	}

	if (!!userWechat) {
		this._fullProfile.nickname = userWechat.nickname;
		this._fullProfile.gender = userWechat.sex;
	}

	if (!!user) {
		this._fullProfile.userId = user._id;
		this._fullProfile.email = user.email;
		this._fullProfile.nickname = user.nickname;
		this._fullProfile.gender = user.gender;
		this._fullProfile.isPwSet = user.password == ''?false:true;

	}

	return this._fullProfile;
}

