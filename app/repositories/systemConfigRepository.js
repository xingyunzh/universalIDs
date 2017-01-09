/**
 * Created by brillwill on 16/11/8.
 */
var fs = require('fs');
var q = require('q');

var cacheHere = null;

exports.getOSSConfig = function(){
    var deferred = q.defer();
    fs.readFile("/root/keys/uidKeys.json", "utf8", function(err, data){
        if (err) {
            deferred.reject(err);
        }
        else {
            var aliyunOSS = JSON.parse(data).aliyunOSS;
            deferred.resolve(aliyunOSS);
        }
    });

    return deferred.promise;
};

exports.getWechatCredentials = function(){
    var deferred = q.defer();
    fs.readFile("/root/keys/uidKeys.json", "utf8", function(err, data){
        if (err) {
            deferred.reject(err);
        }
        else {
            var wechat = JSON.parse(data).wechat;
            deferred.resolve(wechat);
        }
    });

    return deferred.promise;
};

exports.getMongoEnv = function(){

    var data = fs.readFileSync("/root/keys/uidKeys.json", "utf8");
    var mongodb = JSON.parse(data).mongodb;
    return mongodb;
};

exports.getTokenSecret = function(){
    var data = fs.readFileSync("/root/keys/uidKeys.json", "utf8");
    var jwt = JSON.parse(data).jwt;
    return jwt;
};
