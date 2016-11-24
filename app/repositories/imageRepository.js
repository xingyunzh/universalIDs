var OSS = require('ali-oss').Wrapper;
var fs = require('fs');
var scr = require('./systemConfigRepository');
var q = require('q');

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

	http.request(url, function(response) {                                        
		var data = new Stream();                                                    

		response.on('data', function(chunk) {                                       
		   data.push(chunk);                                                         
		});                                                                         

		response.on('end', function() {                                             
		   fs.writeFileSync(imageStorePath + name + '.jpeg', data.read());    
		   deferred.resolve(imageStorePath + name + '.jpeg');
		});                                                  

	}).end();

	return deferred.promise;
	
};