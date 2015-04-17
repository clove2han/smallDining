/**
 * @module controllers/diningMember
 * @description 会员路由
 * @author 韩皎
 * @modified By
 */

var router = require('express').Router();
var diningMember = require(PROXY).diningMember;
var rechargeLog = require(PROXY).rechargeLog;
var cancelMemberLog = require(BASEDIR + '/app/proxy/cancelMemberLog');
var tool = require(BASEDIR + '/app/common/utils/tool');
var validator = require('validator');
var _ = require('underscore');
var syncData = require(BASEDIR+ '/app/common/utils/syncData');
var async = require('async');
var giveRule = require(BASEDIR + '/app/proxy/giveRule');

/**
 * 查询会员信息  (当条件为空时，查询所有数据)
 * @param 会员id
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: member}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/query', function (req, res) {
    var opt = {type: "membLevel"},data = [];
    //定义查询条件
    var query = deleteNull(validator, req.body);
    console.log(query);
    if(query.complete){
        query.$or = [
            {name : query.complete},
            {membNo : query.complete}
        ];
        if(/^\d+$/.test(query.complete)){
            query.$or.push({tel: query.complete});
        }
        delete query.complete
    }

    async.waterfall(
        [
            function (callback) {
                //查询分页条件
                if(query.pageNumber){
                    var pageNumber = parseInt(query.pageNumber); //当前页
                    delete query.pageNumber;
                    diningMember.getMemberCount(query, function (err, count) {
                        if(err){
                            callback(err);
                        }else{
                            var showNumber = 36;   //每页显示的页数
//                            var totalPage = Math.ceil((count-1) / showNumber) ;  //总页数
                            var totalPage = Math.floor((count-1) / showNumber + 1) ;  //总页数
                            totalPage = totalPage >= 0 ? totalPage: 0;
                            data.push({totalPage: totalPage+1});
                            pageNumber = pageNumber <= 1? 0 : (pageNumber > totalPage? totalPage: pageNumber); //当前页的判断
                            opt.skip = pageNumber * showNumber;
                            opt.limit = showNumber;
                            callback(null);
                        }
                    });
                }else{
                    callback(null);
                }
            },
            function (callback) {
                diningMember.getMemberByQuery(query, opt, function (err, docs) {
                    if(err){
                        callback(err);
                    }else{
                        docs.forEach(function (item, index) {
                            data.push(item);
                        });
                        callback(null, data);
                    }
                });
            }
        ], function (err, result) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                return returnSUCCESS(res, result);
            }
        }
    );
});

/**
 * 添加会员
 * @param 会员信息
 * return
 *  SUCCESS : {resultCode: 'SUCCESS, result: "新增会员成功",member}
 *  FAIL    : {resultCode: 'FAIL, result: error.message}
 */
router.post('/add', function (req, res) {
    var params = deleteNull(validator, req.body);
    if(params.tel){
        params.tel = parseInt(params.tel);
    }
    if(params.prepayments && params.mode){
        params.prepayments = parseFloat(params.prepayments, 10);
        params.mode = params.mode? params.mode : "充值金额";             // 充值方式
    }
    if (params.membNo || params.smallNo) {

        async.waterfall([
            function (callback){
                if(params.prepayments != null && params.prepayments != 0) {
                    giveRule.getGiveRuleByQuery({isDel: false}, null, function (error, giveRules) {
                        if (error) {
                            callback(error);

                        } else if (giveRules && giveRules.length > 0) {
                            for (var i in giveRules) {
                                var item = giveRules[i];
                                if (params.prepayments >= item.minAmount) {
                                    params.giveMoney = item.giveMoney;
                                    break;
                                }
                            }
                            callback(null);

                        } else {
                            callback(null);
                        }
                    });
                }else {
                    callback(null);
                }
            },
            function (callback){
                //新增会员
                diningMember.addMember(params, function (err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        syncData.syncDiningMember(data._id);
                        callback(null, data);
                    }
                });
            },
            function (diningMemberObj, callback){
                if(diningMemberObj.prepayments != null && diningMemberObj.prepayments != 0){
                    var newRechargeLog = {
                        diningMemberId: diningMemberObj._id,                    // 会员账号ID
                        amount: diningMemberObj.prepayments,                    // 充值金额
                        giveMoney : diningMemberObj.giveMoney,                  // 赠送金额
                        mode: params.mode,                                      // 充值方式
                        operator: params.operator,                              // 操作员
                        remark: "充值"
                    };
                    //新增充值记录
                    rechargeLog.addOneRechargeLog(newRechargeLog, function (err, rechargeLogData) {
                        if (err) {
                            diningMember.remove({_id: diningMemberObj._id},function(){});
                            callback(err);
                        } else {
                            callback(null, diningMemberObj);
                        }
                    });
                }else{
                    callback(null, diningMemberObj);
                }
            }
        ],function(error, obj){
            if(error){
                return returnFAIL(res, error.message);

            }else {
                return returnSUCCESS(res, obj);
            }
        });

    } else {
        return returnFAIL(res, '卡号或小猫会员帐号不能为空');
    }
});

/**
 * 注销会员
 * @param 会员ID
 * return
 *  SUCCESS : {resultCode: 'SUCCESS, result: "修改会员信息成功"}
 *  FAIL    : {resultCode: 'FAIL, result: error.message}
 */
router.post('/cancel', function (req, res) {
    //更新的会员信息
    var query = {};
    var params = deleteNull(validator, req.body);

    if (params._id) {
        query._id = params._id;
    } else {
        return returnFAIL(res, '没有修改的会员对象');
    }

    if (!params.operator) {
        return returnFAIL(res, '没有指定操作员');
    }


    diningMember.getMemberByQuery(query, {}, function (err, data) {
        if (err) {
            return returnFAIL(res, err.message);

        } else if (data && data.length > 0) {
            if(data[0].state != 2){
                //添加消费记录
                var newCancelMemberLog = {
                    diningMemberId : query._id,        // 会员ID
                    points : data[0].points,            //积分
                    consumer : data[0].prepayments,    // 消费金额
                    giveMoney : data[0].giveMoney,     // 消费赠送
                    operator : params.operator,         // 操作员
                    datetime : Date.now()               // 消费赠送
                };
                //添加消费记录(注销）
                cancelMemberLog.addOneCancelMemberLog(newCancelMemberLog, function (err) {
                    if (err) {
                        return returnFAIL(res, err.message);
                    }else{
                        var update = {
                            $set: {
                                state: 2,
                                prepayments: 0,
                                giveMoney: 0,
                                cancelTime: Date.now()
                            }
                        };
                        //修改会员状态
                        diningMember.updateMember(query, update, function (err, doc) {
                            if (err) {
                                return returnFAIL(res, err.message);
                            } else {
                                syncData.syncDiningMember(query._id);
                                return returnSUCCESS(res, {cancelTime: doc.cancelTime});
                            }
                        });
                    }
                });
            }else{
                return returnFAIL(res, "会员已经注销");
            }
        } else {
            return returnFAIL(res, "未找到要注销的会员");
        }
    });
});

/**
 * 修改会员信息
 * @param 会员所有属性
 * return
 *  SUCCESS : {resultCode: 'SUCCESS, result: "修改会员信息成功"}
 *  FAIL    : {resultCode: 'FAIL, result: error.message}
 */
router.post('/update', function (req, res) {
    //更新的会员信息
    var query = {}, condition = {};
    var params = deleteNull(validator, req.body);

    if (params._id) {
        query._id = params._id;
    } else {
        return returnFAIL(res, '没有修改的会员对象');
    }

    delete params._id;

    if(params.tel){
        params.tel = parseInt(params.tel);
    }
    if (params.membNo) {
        condition = {membNo: params.membNo, _id: {$ne: query._id}};
        updateMember(condition, '会员卡号已存在')

    } else if (params.smallNo) {
        condition = {smallNo: params.smallNo, _id: {$ne: query._id}};
        updateMember(condition, '小猫帐号已存在')

    } else if (params.membNo && params.smallNo) {
        condition = {smallNo: params.smallNo, _id: {$ne: query._id}};
        updateMember(condition, '小猫帐号或会员卡号已存在')

    }
    function updateMember(condition, message) {
        diningMember.getMemberByQuery(condition, {}, function (err, data) {
            if (err) {
                return returnFAIL(res, err.message);
            } else {
                if (data.length > 0) {
                    return returnFAIL(res, message);
                } else {
                    diningMember.getMemberByQuery(query, {}, function (err, result) {
                        var update = _.extend(result, params);
                        diningMember.updateMember(query, update, function (err) {

                            if (err) {
                                return returnFAIL(res, err.message)
                            } else {
                                syncData.syncDiningMember(query._id);
                                return returnSUCCESS(res, '修改成功')
                            }
                        })
                    })
                }
            }
        })
    }
});


/**
 * 删除会员
 * @param membNo : membNo
 * return
 *  SUCCESS : {resultCode: 'SUCCESS, result: "删除会员成功"}
 *  FAIL    : {resultCode: 'FAIL, result: error.message}
 */
router.post('/delete', function (req, res) {
    var membNo = req.body.membNo;
    if (!membNo) {
        return returnFAIL(res, "请选择要删除的会员");
    } else {
        var query = {
            membNo: membNo
        };
        diningMember.remove(query, function (err) {
            if (err) {  //如果有错误，则输出错误信息
                return returnFAIL(res, err.message);
            } else {
                //得到_id 同步数据
                diningMember.queryOneData(query,function(err,doc){
                    if(!err){
                        if(doc._id){
                            syncData.syncDiningMember(doc._id);
                        }
                    }
                });
                return returnSUCCESS(res, "删除会员成功");
            }
        });
    }
});

/**
 * 会员充值功能
 * @param string diningMemberId 会员Id
 * @param string amount 充值金额
 * @param string mode 方式                1:现金 2：银联
 * @param string operator 操作员Id
 */
router.post('/recharge', function (req, res) {
    //为谁充值，充值金额
    var params = deleteNull(validator, req.body);
    console.log("-----------------------会员充值-------------------");
    console.log(params);

    var newRechargeLog = {
        diningMemberId: params.diningMemberId,                  // 会员账号ID
        amount: parseFloat(params.amount, 10),                  // 充值金额
        giveMoney : 0,                                          // 赠送金额
        mode: params.mode? params.mode : 1,                     // 充值方式
        operator: params.operator,                              // 操作员
        remark: "充值"
    };

    if(newRechargeLog.amount && newRechargeLog.amount > 10000){
        return returnFAIL(res, "充值金额上限为10000元");
    }

    async.waterfall([
        function (callback){
            //查询会员
            diningMember.getMemberByQuery({_id: newRechargeLog.diningMemberId}, null, function (err, doc) {
                if (err) {
                    callback(err);
                } else if(doc && doc.length > 0){
                    if(doc[0].state == 1){
                        callback({message: "该卡已挂失，无法充值。"});

                    }else if(doc[0].state == 2){
                        callback({message: "该卡已退卡，无法充值。"});

                    }else{
                        callback(null);
                    }
                }else{
                    callback({message: "没有找到指定会员卡"});
                }
            })
        },
        function (callback){
            //查询赠送规则
            giveRule.getGiveRuleByQuery({isDel: false}, null, function(error, giveRules){
                if(error){
                    callback(error);

                }else if(giveRules && giveRules.length > 0){
                    for(var i in giveRules){
                        var item = giveRules[i];
                        if(newRechargeLog.amount >= item.minAmount){
                            newRechargeLog.giveMoney = item.giveMoney;
                            break;
                        }
                    }
                    callback(null);

                }else{
                    callback(null);
                }
            })
        },
        function (callback){
            //新增充值记录
            rechargeLog.addOneRechargeLog(newRechargeLog, function (err, rechargeLogData) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, rechargeLogData);
                }
            });
        },
        function (rechargeLogData, callback){
            //修改会员余额
            diningMember.updateMember({_id: newRechargeLog.diningMemberId}, {$inc: {prepayments: newRechargeLog.amount, giveMoney: newRechargeLog.giveMoney}}, function (err, doc) {
                if (err) {
                    rechargeLog.removeOneLog({_id: rechargeLogData._id}, function (error) {});
                    callback(err);
                } else {
                    callback(null, rechargeLogData, doc);
                }
            })
        }
    ],function(error, rechargeLogData, doc){
        if(error){
            return returnFAIL(res, error.message);

        }else {
            return returnSUCCESS(res, {
                price: tool.toDecimal1(doc.prepayments),                                    //会员总余额
                giveMoney: tool.toDecimal1(doc.giveMoney),                                  //会员总赠送金额
                rechargePrice: newRechargeLog.amount,                                       //本次充值的金额
                rechargeGiveMoney: newRechargeLog.giveMoney,                                //本次赠送的金额
                datetime: rechargeLogData.datetime    //充值时间
            });
        }
    });
});

module.exports = router;

