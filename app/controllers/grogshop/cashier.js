/**
 * 2015/1/20
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
/**
 * @module controllers/restOrders
 * @description 餐厅订单的路由
 * @author 冀玉鑫
 * @modified By 黄耀奎
 */
var router = require('express').Router();
var restOrders = require(PROXY).restOrders;
var pointsRule = require(PROXY).pointsRule;
var consumerLog = require(PROXY).consumerLog;
var diningMember = require(PROXY).diningMember;
var table = require(PROXY).table;
var tool = require(BASEDIR + '/app/common/utils/tool');
var async = require('async');
var validator = require('validator');
var _ = require('underscore');
var saveSocket = require(CONTROLLERS + '/common/saveSocket');
var tran = require(BASEDIR + '/app/common/utils/transDelegated');

/**
 * 保存收银端的socketId
 */
router.post('/saveSocketId', function (req, res) {
    saveSocket.saveCashier(req.body, function (err) {
        if (err) {
            return returnFAIL(res, err.message);
        } else {
            return returnSUCCESS(res, "保存成功");
        }
    });
});

/*
 { payment:
 '[{"paymentMethod":5,"price":10},{"paymentMethod":1,"price":40}]',
 _id: '54b9d88c69e5680012f708e6',
 cashierId: '5497ba90d79d10141e61407c',
 orderType: '1',
 totalPrice: '50.0' }
 }
 */
router.post('/payBill', function (req, res) {

    checkData(req.body, function (err, resultData) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            var data = resultData;
            var query = {_id: String(data._id)};
            var update = {$set:
            {
                totalPrice: data.totalPrice,
                orderState: 1,                                                          //订单状态(0:待结账 1：已结账）
                cashier: {cashierId: data.cashierId, name: data.cashierName},           //收银员
                isDone: true,
                discount: data.discount,
                discountPrice: data.discountPrice,
                payment: data.payment,
                ongoing: false,
                payDate: new Date()         //付款时间
            }
            };
            if(data.diningMemberId){
                update.$set.diningMemberId = data.diningMemberId;
                memberPay(data ,query, update, function (err, content, tableInfo) {
                    if(err){
                        console.log(err);
                        return returnFAIL(res, err.message);
                    }else{

                        SOCKETIO.sockets.emit('getState', {'ResultCode': 'SUCCESS', 'Result': tableInfo});
                        return returnSUCCESS(res, content);
                    }
                });
            }else{
                otherPay(query, update, function (err, content, tableInfo) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }else{

                        SOCKETIO.sockets.emit('getState', {'ResultCode': 'SUCCESS', 'Result': tableInfo});
                        return returnSUCCESS(res, content);
                    }
                });
            }
        }
    });
});

/**
 * { payment: '[{"paymentMethod":1,"price":170}]',
  _id: '54c36f8e0d3e0ca00de0ad80',
  cashierId: '5497ba90d79d10141e61407c',
  orderType: '1',
  totalPrice: '170.0' }
 * @param data
 * @param callback
 */
function checkData(data, callback) {
    var params = tool.deleteNull(validator, data);
    var returnData = {totalPrice: 0, memberPay: 0}, payTotalPrice = 0;
    console.log(params);

    if (params._id && params.cashierId && params.payment && params.totalPrice) {

        restOrders.getRestOrdersByQuery({_id: params._id}, {'orderState': 1}, function (err, restOrdersData) {
            if(err){
                callback(err);
            }else{
                if(restOrdersData.length > 0){
                    if(restOrdersData[0].orderState == 0){
                        returnData._id = params._id;
                        returnData.totalPrice = tool.toDecimal1(parseFloat(Math.abs(params.totalPrice)));
                        returnData.cashierId = params.cashierId;
                        returnData.discount = params.discount ? tool.toDecimal1Two(params.discount) : 1;
                        returnData.coupon = 0;      //优惠券

                        if (tool.isJson(params.payment)) {
                            var payment = JSON.parse(params.payment);
                            payment.forEach(function (item) {
                                payTotalPrice += item.price;
                                switch (item.paymentMethod) {
                                    case 5:
                                        returnData.coupon = item.price;
                                        break;
                                    case 6:
                                        returnData.memberPay = item.price;
                                        break;
                                }
                            });

                            if (returnData.memberPay > 0) {
                                if (params.diningMemberId) {
                                    returnData.diningMemberId = params.diningMemberId;
                                } else {
                                    callback({message: "参数有误"});
                                }
                            }

                            returnData.payment = payment;
                            returnData.discountPrice = tool.toDecimal1((returnData.totalPrice - returnData.coupon) * returnData.discount);
                            // 实际支付是否等于优惠的价格
                            if (tool.toDecimal1(payTotalPrice - returnData.coupon) != returnData.discountPrice) {
                                callback({message: "参数有误"});
                            } else {
                                staff.getStaffByQuery({_id: returnData.cashierId}, function (err, staffData) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        if (staffData.length > 0) {
                                            returnData.cashierName = staffData[0].userName;
                                            callback(null, returnData);
                                        } else {
                                            callback({message: "参数有误"});
                                        }
                                    }
                                });
                            }

                        } else {
                            callback({message: "参数有误"});
                        }
                    }else{
                        callback({message: "订单不可操作"});
                    }
                }else{
                    callback({message: "订单不存在"});
                }
            }
        });

    } else {
        callback({message: "缺少参数"});
    }
}

function otherPay(query, update, callback) {

    restOrders.updateRestOrders(query, update, function (error, restOrderData) {
        if(error){
            callback(error);
        }else{
            table.update({orderId: query._id}, {$set: {state: 8}}, function (err, tableData) {
                if(err){
                    callback(err);
                }else{
                    var data = {
                        orderNumber: restOrderData.orderNumber,
                        orderTime: restOrderData.payDate
                    };
                    var tableInfo = {
                        _id: tableData._id,
                        state: 8,
                        mealsNumber: tableData.mealsNumber,
                        orderId: tableData.orderId,
                        openDate: tableData.openDate
                    };
                    callback(null, data, tableInfo);
                }
            });

        }
    });
}

function memberPay(data, query, update, callback){
    var arrayData = [];
    async.auto({
        //积分规则
        getPointsRule: function (cb) {
            pointsRule.getLastPointsRule(function (err, result) {
                if(err){
                    cb(err);
                }else{
                    //积分与金额的比率
                    if(result && result.length > 0){
                        var rate = parseFloat(result[0].returnPoints / result[0].consumer);
                        update.backPoints = Math.round(data.memberPay * rate);
                    }else{
                        update.backPoints = 0;
                    }
                    cb(null);
                }
            });
        },
        getTableInfo: function (cb) {
            table.getTableByQuery({orderId: query._id}, {}, function (err, tableData) {
                if(err){
                    cb(err);
                }else{
                    cb(err, tableData[0]);
                }
            });
        },
        //会员信息
        getMemberInfo: function (cb) {
            diningMember.getMemberByQuery({_id: data.diningMemberId},null, function (err, memberData) {
                if(err){
                    cb(err)
                }else{
                    //判断是否有足够的金额支付
                    if(memberData.length > 0){
                        if(memberData[0].prepayments >= data.memberPay){
                            cb(err, memberData);
                        }else{
                            cb({message: "余额不足"});
                        }
                    }else{
                        cb({message: "会员不存在"});
                    }
                }
            });
        },
        tran: ['getPointsRule', 'getMemberInfo', 'getTableInfo', function (cb, result) {
            //事务准备数据
            arrayData.push({
                collection:"restOrders",
                query:query,
                update:update
            });
            arrayData.push({
                collection:"diningMember",
                query:{_id: String(data.diningMemberId)},
                update:{$inc: {prepayments: -data.memberPay}}
            });
            arrayData.push({
                collection:"table",
                query:{_id: String(result.getTableInfo._id)},
                update:{$set: {state: 8}}
            });
            tran(arrayData, function(err){
                cb(err);
            });
        }]
    }, function (err, result) {
        if(err){
            callback(err);
        }else{
            //添加消费记录
            var newConsumer = {
                diningMemberId : data.diningMemberId,        // 会员ID
                points : 0,
                consumer : data.memberPay,                   // 消费金额
                restOrdersId : query._id                       // 订单Id
            };
            consumerLog.addOneConsumer(newConsumer, function (err, log) {
                if (err) {
                    //添加消费记录出错回滚
                    console.log(err);
                }
            });

            restOrders.getOneOrder({_id: query._id}, function (err, orderData) {
                var content = {
                    orderNumber: orderData.orderNumber,
                     orderTime: orderData.payDate
                };
                var tableInfo = {
                    _id: result.getTableInfo._id,
                    state: 8,
                    mealsNumber: result.getTableInfo.mealsNumber,
                    orderId: result.getTableInfo.orderId,
                    openDate: result.getTableInfo.openDate
                };

                callback(null, content, tableInfo);
            });

        }
    });
}
module.exports = router;
