/*
 * 2014/12/23
 * @module
 * @description 系统配置路由
 * @author 黄耀奎
 * @modified By
 */

var router = require('express').Router();
var tool = require(BASEDIR + '/app/common/utils/tool');
var validator = require('validator');
var _ = require('underscore');
var fs = require('fs');
var config = require(BASEDIR + '/app/config/config.json');
var basicData = require(BASEDIR + '/app/config/basicData.json');
var vocationalWorkInfo = require(BASEDIR + '/app/config/vocationalWorkInfo.json');
var shop = require(BASEDIR + '/app/config/shop.json');
var request = require('request');
var async = require('async');

//获得店铺信息
router.post('/getShopInfo', function  (req, res) {
    //联网状态下使用云端
    //否则使用本地
    if(config.isConnected) {
         request.post(tool.getSmallWalletPath()+'/merchant/shop/query', {form:{_id: tool.getDiningId()}}, function  (err, httpResponse, body) {
             if (err) {
                return returnFAIL(res, err.message);
             }else{

                 if(tool.isJson(body)){
                     var resultPackage = JSON.parse(body);
                     if (resultPackage.ResultCode == 'SUCCESS') {
                        delete resultPackage.Result[0].password;
                        delete resultPackage.Result[0].account;
                         return returnSUCCESS(res, resultPackage.Result);
                     }else{
                         return returnFAIL(res, '请求错误');
                     }
                 }else{
                     return returnFAIL(res, '请求错误');
                 }

             }
         });
    }else{
        delete shop[0].password;
        delete shop[0].account;
        return returnSUCCESS(res, shop);
    }
});

//获得表单基本填充数据
router.post('/getBasicData', function  (req, res) {
    //联网状态下使用云端
    //否则使用本地
    if(config.isConnected) {
        async.auto({
            shopType: function (callback) {
                request.post(tool.getSmallWalletPath()+'/merchant/shopType/query', {}, function  (err, httpResponse, body) {
                      if (err) {
                         callback(err);
                      }else{
                          if(tool.isJson(body)){
                              var shopType = JSON.parse(body);
                              callback(err, shopType.Result);
                          }else{
                              callback({message:'请求失败'})
                          }
                      }
                });
            },
            addressData: function(callback){
                request.get(tool.getSmallWalletPath()+'/components/address/addressData.js', {}, function  (err, httpResponse, body) {
                      if (err) {
                        callback(err);
                      }else{
                          try{
                              eval(body);
                          }catch(e){
                              return returnFAIL(res, e);
                          }
                          callback(err, addressData);
                      }
                });
            },
           getMerchant: function (callback) {
               request.post(tool.getSmallWalletPath()+'/merchant/query', {}, function  (err, httpResponse, body) {
                         if (err) {
                            callback(err);
                         }else{
                             if(tool.isJson(body)){
                                 var merchant = JSON.parse(body);
                                 var list = merchant.Result;
                                 var merchantObj = [];
                                 list.forEach(function  (item,index) {
                                     merchantObj.push({_id: item._id, cName: item.cName});
                                 });
                                 callback(err, merchantObj);

                             }else{
                                 callback({message:'请求失败'});
                             }
                         }
               });
           },
           assemble: [ 'addressData', 'getMerchant', 'shopType', function(callback, result) {
               callback(null, JSON.stringify(result));
           }]
        }, function(err, results) {
            if (err) {
                return returnFAIL(res, err.message);
            }else{
                delete results.assemble;
                var basicData_json = JSON.stringify(results);
                fs.writeFile(BASEDIR + '/app/config/basicData.json', basicData_json, function(err) {
                    if(err){
                        console.log(err);
                    }
                });
                return returnSUCCESS(res, results);
            }
        });

    }else{
        return returnSUCCESS(res, basicData);
    }
});


//获得表单基本填充数据
router.post('/vocationalWorkInfo', function  (req, res) {
    //联网状态下使用云端
    //否则使用本地
    if(config.isConnected) {
        async.auto({
            businessType: function (callback) {
                request.post(tool.getSmallWalletPath()+'/merchant/businessType/query', {}, function  (err, httpResponse, body) {
                      if (err) {
                        callback(err);

                      }else{
                          if(tool.isJson(body)){
                              var businessType = JSON.parse(body);
                              callback(err, businessType.Result);
                          }else{
                              callback({message: '请求失败'});
                          }

                      }
                });
            },
            assemble: ['businessType',  function(callback, result) {
                callback(null, JSON.stringify(result));
            }]
        }, function(err, results) {
            if (err) {
                return returnFAIL(res, err.message);
            }else{
                delete results.assemble;
                return returnSUCCESS(res, results);
            }
        });
    }else{
        return returnSUCCESS(res, vocationalWorkInfo);
    }
});

//修改店铺信息
router.post('/update', multipartMiddleware, function(req, res){
    var params = req.body;
    //是否包含图片
    var isHasImg = false;
    if(req.files){
        var file = req.files;
        isHasImg = true;
    }

    params._id = tool.getDiningId();
    if(params.avgConsumer){
        params.avgConsumer = Math.abs(parseFloat(params.avgConsumer));
    }
    if(isHasImg){
        if(!tool.isObjectEmpty(file) && file.picture){
            if (tool.isImg(file.picture.originalFilename)) {
                isHasImg = true;
                var oldPath = BASEDIR + '/public/images/' + tool.getImgName(); //旧图片路径

                var newName = tool.renameImg(file.picture.originalFilename); //新图片名字
                var newPath = BASEDIR + '/public/images/' + newName;         //新图片保存位置
                tool.moveAndDelSync(file.picture.path, newPath);             //保存新图片并删除临时图片
                config.imgName = newName;                                    //保存新图片名字
                tool.setImgName(config, function (err) {
                    console.log(err);
                });
                tool.delFile(oldPath);                                      //删除旧图片
                fs.createReadStream(newPath);
                params.picture = newName;

            }else{
                return returnFAIL(res, "图片格式不合法");
            }
        }
    }


    //联网状态下使用云端
    //否则使用本地
    if(config.isConnected) {
        if(params.position){
            params.position = JSON.stringify(params.position);
        }
        var r = request.post({url:tool.getSmallWalletPath()+'/server/merchant/shop/push',formData:params}, function (err, httpResponse, body) {
            if(!err){
                try{
                    if(JSON.parse(body)){
                        var json = JSON.parse(body);
                        if (json.ResultCode == "SUCCESS") {
                            return returnSUCCESS(res, '修改成功');
                        }else{
                            return returnFAIL(res, json.Result);
                        }
                    }else{
                        return returnFAIL(res, "系统错误");
                    }

                }catch (e){
                    return returnFAIL(res, e);
                }

            }else{
                return returnFAIL(res, err.message);
            }
        });

    }else{
        if(params.position){
            params.position = JSON.parse(params.position);
        }
        shop[0] = _.extend(shop[0], params);

        var shop_json = JSON.stringify(shop);
        fs.writeFile(BASEDIR + '/app/config/shop.json', shop_json, function(err) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                return returnSUCCESS(res, '修改成功');
            }
        });
    }
});

module.exports = router;
