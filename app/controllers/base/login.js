/**
 * 2014/10/17
 * @module /login
 * @description
 * @author 黄耀奎
 * @modified By
 */


var router = require('express').Router();
var validator = require('validator');
var request = require('request');
var utils = require('utility');
var async = require('async');
var staff = require(BASEDIR + '/app/proxy/staff');
var config = require(BASEDIR + '/app/config/config.json');
var shop = require(BASEDIR + '/app/config/shop.json');

var fs = require('fs');
var tool = require(BASEDIR + '/tools/tool');

/**
 * 设置端登录接口
 * 帐号，密码是申请入驻的时所填的
 */
router.post('/admin', function (req, res) {
    var form = deleteNull(validator, req.body);
    if(!form.account || !form.password){
        return returnFAIL(res, "缺少参数");
    }
    if(form.password){
        form.password = utils.md5(form.password);

    }

    //联网状态下使用云端登陆
    //否则使用本地登陆
    if(config.isConnected) {
        request.post({url:tool.getSmallWalletPath()+'/merchant/shop/shopLogin', form: form}, function optionalCallback(err, httpResponse, body) {
            if (err) {
                return returnFAIL(res, err.message);
            }else{
                try{
                    var jsonObj = JSON.parse(body);
                    if(jsonObj.ResultCode == 'SUCCESS'){
                        if(config.diningId != "" && config.diningId != jsonObj.Result){
                            return returnFAIL(res, "不是首次设置的帐号，请注销后再登录");
                        }
                        config.diningId = jsonObj.Result;
                        var confing_json = JSON.stringify(config);
                        fs.writeFile(BASEDIR + '/app/config/config.json', confing_json, function(err) {
                            if(err){
                                return returnFAIL(res, err.message);
                            }else{
                                return returnSUCCESS(res, "登录成功");
                            }
                        });
                    }else{
                        return returnFAIL(res, jsonObj.Result);
                    }
                }catch (e){
                    return returnFAIL(res, e);
                }

            }
        });
    }else{
        if(tool.getAccount() == form.account){
            if(tool.getPassword() == form.password){
                return returnSUCCESS(res, "登录成功");
            }else{
                return returnFAIL(res, "密码错误");
            }
        }else{
            return returnFAIL(res, "帐号不存在");
        }
    }
});

/**
 * 收银端登录接口
 * @param account string 帐号
 * @param password string 密码
 */
router.post('/cashierLogin', function (req, res) {
    var param = deleteNull(validator, req.body);

    if(!param.account || !param.password){
        return returnFAIL(res, '信息不完整');
    }
    var password = utils.md5(param.password);
    var query = {account: param.account};

    query.isDel = false;
    async.waterfall([
        function (callback) {
            staff.getStaffByQuery(query, {}, function (err, staffs){
                callback(err, staffs)
            })
        },
        function(staffs, callback) {
            if(staffs.length > 0){
                if(password == staffs[0].password){
                    callback(null, staffs);
                }else{
                    callback({message: "密码错误"})
                }
            }else{
                callback({message: "用户不存在"});
            }
        },
        function (staffs, callback) {
            var permissionList = staffs[0].role.permissionList;
            //是否是收银员登录
            if(permissionList.indexOf(4) !== -1 || permissionList.indexOf(2) !== -1){
                console.log(staffs[0]._id)
                callback(null, staffs);
            }else{
                var err = {message: "只允许收银员登录"};
                callback(err);
            }

            delete staffs[0].password;
        },
        function (staffs, callback) {
            if(staffs[0].isAlternate){
                staff.updateStaff({_id: staffs[0]._id}, {$set: {loginDate: Date.now(), isAlternate: false}}, function (err) {
                    callback(err, staffs)
                });
            }else{
                callback(null, staffs)
            }
        }
    ], function (err, result) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            SOCKETIO.sockets.emit('cashierIn', {_id: result[0]._id, name: result[0].name, position: result[0].position});
            delete result[0].password;
            return returnSUCCESS(res, result);
        }
    });


});

/**
 * 其他端登录
 */
router.post('/otherLogin', function (req, res) {
    var param = deleteNull(validator, req.body);
    if(!param.account || !param.password){
        return returnFAIL(res, '信息不完整');
    }
    var password = utils.md5(param.password);
    var query = {account: param.account};

    query.isDel = false;

    async.waterfall([
        function (callback) {
            staff.getStaffByQuery(query, {}, function (err, staffs){
                callback(err, staffs)
            })
        },
        function(staffs, callback) {
            if(staffs.length > 0){
                if(password == staffs[0].password){
                    callback(null, staffs);
                }else{
                    var err = {message: "密码错误"};
                    callback(err)
                }
            }else{
                var err = {message: "用户不存在"};
                callback(err);
            }
        }
    ], function (err, result) {
        if(err){
            return returnFAIL(res, err.message);
        }
        delete result[0].password;
        return returnSUCCESS(res, result);

    });
});


module.exports = router;