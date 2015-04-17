/**
 * @module controllers/statistics
 * @description 餐厅统计的路由
 * @author 冀玉鑫
 * @modified By 黄耀奎
 */
var router = require('express').Router();
var statistics = require(PROXY).statistics;
var validator = require('validator');
var rechargeLog = require(BASEDIR + '/app/proxy/rechargeLog');
var consumerLog = require(BASEDIR + '/app/proxy/consumerLog');
var cancelMemberLog = require(BASEDIR + '/app/proxy/cancelMemberLog');
var async = require('async');
var tool = require(BASEDIR + '/app/common/utils/tool');

/**
 * 按会员时间信息统计
 * @params memberId : 会员ID
 * @params startTime : 开始时间
 * @params endTime : 结束时间
 */
router.post('/memberAnalyze' , function (req, res) {
    var params = deleteNull(validator, req.body);
    var query = {};
    if(params.diningMemberId){
        query.diningMemberId= params.diningMemberId;
    }

    if(params.startTime || params.endTime){
        query.datetime = {
            "$gte": new Date(params.startTime),
            "$lt": new Date(params.endTime)
        };
    }

    async.waterfall([
        //查询充值记录
        function (callback) {
            rechargeLog.queryRechargeLog(query, function(err, recharges){
                if(err){
                    callback(err);
                }else{
                    callback(null, recharges);
                }
            });
        },
        //查询消费记录
        function (recharges, callback) {
            consumerLog.getConsumerLogByQuery(query, function(error, consumers){
                if(error){
                    callback(error);
                }else{
                    callback(null, recharges, consumers);
                }
            });
        },
        //查询退卡记录
        function (recharges, consumers, callback) {
            cancelMemberLog.getCancelMemberLogByQuery(query, function(error, cancelMembers){
                if(error){
                    callback(error);
                }else{
                    callback(null, recharges, consumers, cancelMembers);
                }
            });
        },
        function (recharges, consumes, cancelMembers, callback) {
            var bills = [];
            //充值记录放到新的数组中
            if(recharges){
                recharges.forEach(function(recharge){
                    var bill = {};
                    bill.payment = {
                        basicPrice: recharge.amount,
                        giveMoney: recharge.giveMoney
                    };
                    bill.payDate = recharge.datetime;
                    if(recharge.mode == 3){
                        bill.type = "changeBack";
                    }else{
                        bill.type = "recharge";
                    }
                    bills.push(bill);
                });
            }
            //消费记录放到新的数组中
            if(consumes){
                consumes.forEach(function(consume){
                    var bill = {};
                    bill.payment = {
                        basicPrice: consume.consumer,
                        giveMoney: consume.giveMoney
                    };
                    bill.payDate = consume.datetime;
                    bill.type = "expend";
                    bills.push(bill);
                });
            }
            //退卡记录放到新的数组中
            if(cancelMembers){
                cancelMembers.forEach(function(cancelMember){
                    var bill = {};
                    bill.payment = {
                        basicPrice: cancelMember.consumer,
                        giveMoney: cancelMember.giveMoney
                    };
                    bill.payDate = cancelMember.datetime;
                    bill.type = "cancel";
                    bills.push(bill);
                });
            }
            //按时间排序
            bills.sort(tool.getSortArray('desc', 'payDate'));
            callback(null, bills);
        }
    ], function (err, bills) {
        if(err){
            return returnFAIL(res, err.message);

        }else{
            return returnSUCCESS(res, bills);
        }
    });

});

/**
 * 按餐厅时间信息统计
 */
router.post('/restAnalyze' , function (req, res) {
    var query = {};
    if(req.body.startTime || req.body.endTime){
        query["payDate"] = {
            "$gte": new Date(req.body.startTime),
            "$lt": new Date(req.body.endTime)
        };
    }

    statistics.restAnalyze(query, null, function(error, restOrders){
        if(error){  //如果有错误，则输出错误信息
            return returnFAIL(res, error.message);

        }else{ //否则返回全部菜品类型
            return returnSUCCESS(res, restOrders);
        }
    });
});
module.exports = router;