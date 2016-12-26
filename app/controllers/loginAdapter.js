

exports.viaWechat = function(req,res) {
	var code = req.params.code;

	var deferred = q.defer();

	wechat.getAccessToken(code,function(err,at,oi){
		if (err) {
			deferred.reject(err);
		}else{
			deferred.resolve(oi);
		}
	});

	deferred.promise.then(function getWechatInfo(openId){
		var d = q.defer();

		wechat.getUserInfo(openId,function(err,userInfo){
			if (err) {
				d.reject(err);
			}else{
				d.resolve(userInfo);
			}
		});

		return d.promise;
	}).then(function(userInfo){
		
	}).catch(function(err){
		console.log(err);
		res.send(util.wrapBody('Adapter Error','E'));
	});
};


