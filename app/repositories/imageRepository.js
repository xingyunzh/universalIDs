var OSS = require('ali-oss').Wrapper;
var fs = require('fs');
var scr = require('./systemConfigRepository');
var q = require('q');
var http = require('http');

var imageStorePath = '/root/temp/images/';

exports.putToOSS = function(name,path) {
	return scr.getOSSConfig().then(function(keys){
		var client = new OSS(keys);

		return client.put(name,path);
	});
};

exports.getFromOSS = function(name){
	return scr.getOSSConfig().then(function(keys){
		var client = new OSS(keys);

		return client.get(name);
	});
};

exports.getFromUrl = function(name,url){
	var deferred = q.defer();
	var path = imageStorePath + name + '.jpeg';

	var file = fs.createWriteStream(path);
	http.get(url, function(response) {
  		response.pipe(file);
  		file.on('finish',function(){
  			deferred.resolve(path);
  		});
	}).on('err',function(err){
		deferred.reject(err);
	});

	return deferred.promise;
	
};