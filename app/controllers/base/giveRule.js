/**
 * @module app/controllers/giveRule
 * @description 赠送规则的路由
 * @author 冀玉鑫
 * @modified By
 */
var router = require('express').Router();
var giveRule = require(BASEDIR + '/app/proxy/giveRule');
var validator = require('validator');
var async = require('async');

/**
 * 根据条件查询赠送规则
 * @param id : 赠送规则ID
 * @param name : 赠送规则名称
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: giveRules}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/query' , function (req, res) {
    var query = deleteNull(validator, req.body);
    query.isDel = false;

    giveRule.getGiveRuleByQuery(query, null, function(error, giveRules){
        if(error){
            return returnFAIL(res, error.message);

        }else{
            return returnSUCCESS(res, giveRules);
        }
    });
});

/**
 * 新增赠送规则
     maxAmount: params.maxAmount,                 // 等级最大金额
     minAmount: params.minAmount,                 // 等级最小金额
     giveMoney: params.giveMoney                  // 赠送积分
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: jellybean._id}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/create' , function (req, res) {
    var params = req.body;
    if(!params.giveMoney || !params.maxAmount || !params.minAmount) {
        return returnFAIL(res, "参数不全");

    }else{
        //新增的商品类型对象
        var newGiveRule = {
            maxAmount: parseFloat(params.maxAmount),                 // 等级最大金额
            minAmount: parseFloat(params.minAmount),                 // 等级最小金额
            giveMoney: parseFloat(params.giveMoney)                  // 赠送金额
        };

        async.waterfall([
            function (callback){
                giveRule.getGiveRuleByQuery({isDel: false}, null, function(error, giveRules){
                    if(error){
                        callback(error);

                    }else if(giveRules && giveRules.length > 0){
                        callback(null, giveRules);
                    }else{
                        callback(null, []);
                    }
                })
            },
            function (giveRules, callback){
                var rational = isRational(giveRules, newGiveRule.minAmount, newGiveRule.maxAmount);
                //验证赠送规则是否重复并已被删除
                if(isRepeat(giveRules, newGiveRule)){
                    giveRule.updateGiveRule(newGiveRule, {$set: {"isDel": false}}, function(error, jellybean){
                        if(error){
                            callback(error);

                        }else{
                            callback(null, jellybean);
                        }
                    });

                //验证新的赠送规则是否合法
                }else if(rational.flag == false){
                    callback({"message": rational.msg});

                }else{

                    //新增赠送规则
                    giveRule.addGiveRule(newGiveRule, function(error, jellybean){
                        if(error){
                            callback(error);

                        }else{
                            callback(null, jellybean);
                        }
                    })
                }

            }
        ],function(error, result){
            if(error){
                return returnFAIL(res, error.message);

            }else {
                return returnSUCCESS(res, result._id);
            }
        });
    }
});

/**
 * 赠送规则 - 修改
 * @param id : 赠送规则ID
     maxAmount: params.maxAmount,                 // 最大金额
     minAmount: params.minAmount,                 // 最小金额
     giveMoney: params.giveMoney                  // 赠送金额
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: "修改赠送规则成功"}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/modify' , function (req, res) {
    var params = req.body;
    if(params._id){
        //更新赠送规则的查询条件
        var query = {
            _id : params._id
        };

        var update = {};
        if(params.maxAmount) {
            update.maxAmount = parseFloat(params.maxAmount);                 // 等级最大金额
        }
        if(params.minAmount) {
            update.minAmount = parseFloat(params.minAmount);                 // 等级最小金额
        }
        if(params.giveMoney) {
            update.giveMoney = parseFloat(params.giveMoney);                 // 赠送金额
        }

        if(isEmptyObject(update)){
            return returnFAIL(res, "没有要修改的内容");

        }else{
            async.waterfall([
                function (callback){
                    giveRule.getGiveRuleByQuery({isDel: false}, null, function(error, giveRules){
                        if(error){
                            callback(error);

                        }else if(giveRules && giveRules.length > 0){
                            callback(null, giveRules);

                        }else{
                            callback({"message": "未找到指定赠送规则"});
                        }
                    })
                },
                function (giveRules, callback){
                    var rational = isRational(giveRules, update.minAmount, update.maxAmount, query._id);
                    if(rational.flag == false){
                        callback({"message": rational.msg});

                    }else{
                        giveRule.updateGiveRule(query, {$set: update}, function(error){
                            if(error){
                                callback(error);

                            }else{
                                callback(null);
                            }
                        });
                    }

                }
            ],function(error){
                if(error){
                    return returnFAIL(res, error.message);

                }else {
                    return returnSUCCESS(res, "修改赠送规则成功");
                }
            });
        }
    }else{
        return returnFAIL(res, "请选择要修改的赠送规则");
    }
});

/**
 * 批量删除赠送规则
 * @param ids : 赠送规则ID ( { ids: '001, 002'} )
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: "删除赠送规则成功"}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/remove' , function (req, res) {
    var ids = req.body.ids.trim();
    var idArr = [];
    if(ids) idArr = ids.split(',');

    if(idArr.length > 0){
        var errorMessage = [];

        //并联的同步循环
        async.each(idArr, function(item,callback){
            //删除的条件
            var query = {
                _id: item
            };
            giveRule.updateGiveRule(query, {$set: {isDel: true, isUpload:false}}, function (error, data) {
                if (error) {
                    errorMessage.push(error.message);
                }
                callback();
            });
        },function(err){
            errorMessage.length > 0 ? returnFAIL(res, errorMessage) : returnSUCCESS(res, "删除赠送规则成功");
        });
    }else{
        return returnFAIL(res, "请选择删除的赠送规则");
    }
});

/**
 * 获取赠送金额
 * @param balance     ：   充值金额
 * @param callback     ：   充值金额
 */
exports.getGiveMoney = function(balance, callback){
    giveRule.getGiveRuleByQuery({isDel: false}, null, function(error, giveRules){
        if(error){  //如果有错误，则输出错误信息
            return callback(error);

        }else if(giveRules && giveRules.length > 0){
            var giveMoney = 0;
            for(var i = 0; i < giveRules.length; i++){
                var giveRule = giveRules[i];
                if((balance < giveRule.maxAmount || giveRule.maxAmount == -1) && balance >= giveRule.minAmount){
                    giveMoney = giveRule.giveMoney;
                    break;
                }
            }
            return callback(null, giveMoney);
        }else{
            return callback(null, 0);
        }
    });
};

/**
 * 验证新的赠送规则是否重复,并且已经被删除。
 *  oldGiveRules : 原有的赠送规则数组
 *  newGiveRule: 新的赠送规则
 *  return : true/false
 */
var isRepeat = function(oldGiveRules, newGiveRule){
    var result = false;
    if(oldGiveRules && oldGiveRules.length > 0){
        oldGiveRules.forEach(function(item){

            if(newGiveRule.maxAmount == item.maxAmount && newGiveRule.minAmount == item.minAmount && newGiveRule.giveMoney == item.giveMoney && true == item.isDel){
                result = true;
                return false;
            }
        });
    }
    return result;
};

/**
 * 验证新的赠送规则是否合法。
 * 1.最大金额必须大于等于最小金额
 * 2.最大金额小于以后赠送规则的最小金额 或 最小金额大于已有金额的最大金额
 *  oldGiveRules : 原有的赠送规则数组
 *  newMinAmount: 新最小金额
 *  newMaxAmount: 新最大金额
 *  return : {
 *      flag : true / false
 *      msg : "失败原因"
 *  }
 */
var isRational = function(oldGiveRules, newMinAmount, newMaxAmount, excludeId){
    var result = {flag : true, msg: "验证通过"};
    if(!oldGiveRules || (!newMinAmount && newMinAmount !=0) || (!newMaxAmount && newMaxAmount !=0)){
        result.flag = false;
        result.msg = "参数有误";

    }else if(newMinAmount < 0){
        result.flag = false;
        result.msg = "最小金额不能小于0";

    }else if(newMaxAmount < newMinAmount){
        result.flag = false;
        result.msg = "最大金额小于最小金额";

    }else{
        for(var i in oldGiveRules){
            var item = oldGiveRules[i];
            if(excludeId == item._id){
                continue;
            }
            //最小金额有冲突
            if(newMaxAmount <= item.maxAmount && newMaxAmount > item.minAmount){
                result.flag = false;
                result.msg = "最大金额有冲突";
                break;

                //最小金额有冲突
            }else if(newMinAmount >= item.minAmount && newMinAmount < item.maxAmount){
                result.flag = false;
                result.msg = "最小金额有冲突";
                break;
            }
        }
    }
    return result;
};

module.exports = router;