var wechatAppRepository = require('../repositories/wechatAppRepository');
var util = require('../util/util');

exports.create = function(req,res){
  var query = req.query;
  if(util.checkParam(req.query,['name','appId','secret','code']) && query.code == 'yoroshiku'){
    var app = {
      alias:query.name,
      appId:query.appId,
      secret:query.secret
    }

    wechatAppRepository.create(app).then(function(app){
      res.send(util.wrapBody({
        app:app
      }));
    }).catch(function(err){
      console.log(err);
      res.send(util.wrapBody('Internal Error','E'));
    })
  }else{
    res.send(util.wrapBody('wrong code','E'));
  }
}

// exports.updateByName = function(req,res){
//   var query = req.query;
//   if(!!query.code && query.code == 'yoroshiku'){
//     var conditions = {name:query.name}
//
//     wechatAppRepository.update(app).then(function(app){
//       res.send(util.wrapBody({
//         app:app
//       }));
//     }).catch(function(err){
//       console.log(err);
//       res.send(util.wrapBody('Internal Error','E'));
//     })
//   }else{
//     res.send(util.wrapBody('wrong code','E'));
//   }
// }
