/**
 * 2015/1/29
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var restOrders = require(PROXY).restOrders;
var dishesOrder = require(PROXY).dishesOrder;
var pointsRule = require(PROXY).pointsRule;
var rechargeLog = require(PROXY).rechargeLog;
var tool = require(BASEDIR + '/app/common/utils/tool');
var async = require('async');
var tran = require(BASEDIR + '/app/common/utils/transDelegated');
var consumerLog = require(BASEDIR + '/app/proxy/consumerLog');


/**
 * 共用退菜方法
 */
exports.recedeDishes = function (isSnack, dishesOrderId, operator, number, callback) {
    var number = Math.abs(parseInt(number));
    getInfo(dishesOrderId, operator, number, function (err, result) {
        if(err){
            callback(err);
        }else{
            //已经完成的订单退款直接把钱按方式返还
            //是否有会员支付
            if(result.restOrderData.diningMemberId){
                returnCard(isSnack, number, result, function (err, res) {
                    callback(err, res);
                });
            }else{
                returnCash(isSnack, number, result, function (err, res) {
                    callback(err, res);
                });
            }
        }
    })
};

/**
 * 验证数据
 * @param dishesOrderId
 * @param operator
 * @param number
 * @param callback
 */
function getInfo(dishesOrderId, operator, number, callback) {
    if(dishesOrderId){
        var res = {};
        async.auto({
            getStaffCardInfo: function (cb) {
                //查找操作员是否有权限
                staff.getStaffByQuery({_id: operator}, function (err, staffData) {
                    if(err){
                        cb(err);
                    }else if(staffData[0] && staffData.length > 0){
                        cb(err, staffData[0]);
                    }else{
                        cb({message: "该操作员不存在"});
                    }
                });
            },
            getDishesOrderInfo: function (cb) {
                var query = {_id: dishesOrderId, state: {$ne: 5}};
                dishesOrder.queryOneData(query, function (err, dishesOrderData) {
                    if(err){
                        cb(err);
                    }else{
                        if(tool.isObjectEmpty(dishesOrderData)){
                            cb({message: "菜品订单不存在"});
                        }else{
                            cb(err, dishesOrderData);
                        }
                    }
                })
            },
            getOrderInfo: ['getDishesOrderInfo', function (cb, data) {
                var dishesOrderData = data.getDishesOrderInfo;
                //判断该菜品是否可退
                //点的数量 >= 退的数量
                if(dishesOrderData.quantity >= (dishesOrderData.recedeNum + number)){
                    var condition = {_id: dishesOrderData.orderId};

                    restOrders.queryOneData(condition, function (err, restOrderData) {
                        if(err){
                            cb(err);
                        }else{
                            if(tool.isObjectEmpty(restOrderData)){
                                cb({message: "没有找到订单信息"});

                            }else{
                                cb(err, restOrderData);
                            }
                        }
                    });

                }else{
                    cb({message: "退菜数量超出已点的数量"});
                }
            }]
        }, function (err, result) {
            if(err){
                callback(err);
            }else{
                res.dishesOrderData = result.getDishesOrderInfo;
                res.restOrderData = result.getOrderInfo;
                res.staffCardData = result.getStaffCardInfo;
                callback(null, res);
            }
        });
    }else{
        callback({message: "参数错误，没有菜品信息"});
    }
}

/**
 * 把钱退到卡里
 * @param isSnack string 是否使用库存
 * @param number int 退的数量
 * @param data json 查询到的准备数据
 * @param callback 回调函数
 */
function returnCard(isSnack, number, data, callback){
    var dishesOrderData = data.dishesOrderData;
    var restOrderData = data.restOrderData;
    var staffCardData = data.staffCardData;

    var returnData = {};
    var dishesUpdate = {};

    // 状态 ( 0:待做  1:正在做菜  2:催菜 3:已做完 4:已上菜, 5:已退完所有数量)
    if(dishesOrderData.state < constant.DISHES_STATE.HAVE_DONE){
        returnData.sendSocketToPrepare = true;
        returnData.sendSocketToGoFood = true;
        dishesUpdate = {$inc: {haveOnNumber: -number}};

    }else if(dishesOrderData.state < constant.DISHES_STATE.REFUND_FULL){
        returnData.sendSocketToGoFood = true;
        dishesUpdate = {$inc: {haveOnNumber: -number}};
    }

    var dishesOrderUpdate = {$inc: {recedeNum: number}};
    if(dishesOrderData.quantity <= (dishesOrderData.recedeNum + dishesOrderData.goUpNum + number)){
        dishesOrderUpdate.$set = {state: constant.DISHES_STATE.HAVE_SERVING};
    }
    if(dishesOrderData.quantity == (dishesOrderData.recedeNum + number)){
        dishesOrderUpdate.$set ? dishesOrderUpdate.$set.state = constant.DISHES_STATE.REFUND_FULL : dishesOrderUpdate.$set = {state: constant.DISHES_STATE.REFUND_FULL};
    }

    returnData.dishesOrderId = dishesOrderData._id;
    //要退的钱 = 数量*单价*折扣
    returnData.price = tool.toDecimal1(number * dishesOrderData.price * restOrderData.discount);
    var orderUpdate = {$push: {refund:{staffCardId: staffCardData._id, paymentMethod: constant.PAYMENT_METHOD.MEMBER_PAY, price: returnData.price}}};
    returnData.recedeType = constant.PAYMENT_METHOD.MEMBER_PAY;

    var memberUpdate = {$inc: {prepayments: returnData.price}};

    //查出积分规则
    pointsRule.getLastPointsRule(function (err, result) {
        if(err){
            callback(err);
        }else{
            if(result.length > 0){
                var rate = parseFloat(result[0].returnPoints / result[0].consumer);
                rate = Math.round(returnData.price * rate);
                memberUpdate.$inc.points = -rate
            }

            //事务数据准备
            var array = [
                {
                    collection: "dishesOrder",
                    query: {_id: String(dishesOrderData._id)},
                    update: dishesOrderUpdate
                },
                {
                    collection: "restOrders",
                    query:{_id: String(restOrderData._id)},
                    update: orderUpdate
                },
                {
                    collection: "diningMember",
                    query:{_id: String(restOrderData.diningMemberId)},
                    update: memberUpdate
                }
            ];

            //是否要操作库存
            if(isSnack){
                array.push(
                    {
                        collection: "dishes",
                        query: {_id: String(dishesOrderData.dishesId)},
                        update: dishesUpdate
                    }
                );
            }

            tran(array, function(err){
                if(err){
                    callback(err);
                }else{
                    consumerLog.getConsumerLogByQuery({restOrdersId: restOrderData._id},function(error, docs){
                        if(error){
                            callback(err);

                        }else if(docs && docs.length > 0){
                            var consumer = docs[0];
                            var surplusConsumer = 0;                                //消费金额剩余
                            var amount = 0;                                         //退还基本金额
                            var giveMoney = 0;                                      //退还赠送金额
                            var returnPrice = 0;                                    //已退总额
                            restOrderData.refund.forEach(function(item){
                                returnPrice += item.price;
                            });
                            returnPrice = tool.toDecimal1(returnPrice);         //格式化已退价格

                            //如果消费总额小于退款总额
                            if((consumer.consumer + consumer.giveMoney) < (returnData.price + returnPrice)) {
                                callback({message: "退款金额大于已消费金额"});

                            }else{
                                //如果消费基本金额大于等于已退金额
                                if (consumer.consumer >= returnPrice) {
                                    surplusConsumer = consumer.consumer - returnPrice;

                                } else {
                                    surplusConsumer = 0;
                                }

                                //如果消费基本金额大于等于要退的金额
                                if (surplusConsumer >= returnData.price) {
                                    amount = returnData.price;

                                } else {
                                    amount = surplusConsumer;
                                    giveMoney = returnData.price - surplusConsumer;
                                }

                                //退成功后添加一条会员的退款记录
                                var newRechargeLog = {
                                    diningMemberId: restOrderData.diningMemberId,
                                    amount: amount,
                                    giveMoney: giveMoney,                                                                                                       // 赠送金额
                                    remark: '操作员:' + staffCardData.name + ',退' + number + '份' + dishesOrderData.name + '返还' + returnData.price + '元',     // 备注
                                    operator: staffCardData._id,                                                                                                // 操作员
                                    mode: 3                                                                                                                     // 充值方式     1.现金    2.银联卡   3.退款
                                };

                                rechargeLog.addOneRechargeLog(newRechargeLog, function (err) {});
                                dishesOrder.getDishesOrderByQuery({_id: dishesOrderData._id}, {}, function (err, dishesOrderData) {
                                    returnData.dishesOrderData = dishesOrderData;
                                    callback(err, returnData);
                                });
                            }
                        }
                    });
                }
            });
        }
    });
}

/**
 * 退现金
 * @param isSnack string 是否使用库存
 * @param number int 退的数量
 * @param data json 查询到的准备数据
 * @param callback 回调函数
 */
function returnCash(isSnack, number, data, callback) {
    var dishesOrderData = data.dishesOrderData;
    var restOrderData = data.restOrderData;
    var staffCardData = data.staffCardData;
    var returnData = {};
    var dishesUpdate = {};

    if(dishesOrderData.state < constant.DISHES_STATE.HAVE_DONE){
        returnData.sendSocketToPrepare = true;
        returnData.sendSocketToGoFood = true;
        dishesUpdate = {$inc: {haveOnNumber: -number}};

    }else if(dishesOrderData.state < constant.DISHES_STATE.REFUND_FULL){
        returnData.sendSocketToGoFood = true;
        dishesUpdate = {$inc: {haveOnNumber: -number}};
    }

    var dishesOrderUpdate = {$inc: {recedeNum: number}};
    //菜的数量 <= 已退菜数量 +　上菜数量　+ 本次退菜数量
    if(dishesOrderData.quantity <= (dishesOrderData.recedeNum + dishesOrderData.goUpNum + number)){
        dishesOrderUpdate.$set = {state: constant.DISHES_STATE.HAVE_SERVING};
    }

    //菜的数量　== 已退数量 + 本次退菜数量
    if(dishesOrderData.quantity == (dishesOrderData.recedeNum + number)){
        dishesOrderUpdate.$set = {state: constant.DISHES_STATE.REFUND_FULL};
    }

    //要退的钱 = 数量*单价*折扣
    var price = tool.toDecimal1(number * dishesOrderData.price * restOrderData.discount);

    //退菜的方式 默认为未支付
    var paymentMethod = constant.REFUND_METHOD.NOT_PAY;

    console.log("支付方式---------------------------------------------------------");
    console.log(restOrderData);
    console.log(restOrderData.payment);
    if(restOrderData.payment){
        console.log(restOrderData.payment);
        if(restOrderData.payment.length == 1){
            if(restOrderData.payment[0].paymentMethod == constant.PAYMENT_METHOD.VOUCHER_PAY){
                callback({message: "免单订单不能退菜"});

            }else if(restOrderData.payment[0].paymentMethod == constant.PAYMENT_METHOD.FREE_PAY){
                callback({message: "优惠券支付不能退菜"});
            }
        }
        restOrderData.payment.forEach(function(item){
            console.log("退菜方式" + item.paymentMethod);
            //如果支付方式不为免单并且代金券，则记录退菜方式
            if(item.paymentMethod != constant.PAYMENT_METHOD.VOUCHER_PAY && item.paymentMethod != constant.PAYMENT_METHOD.FREE_PAY){
                paymentMethod = item.paymentMethod;
            }
        });
    }

    var orderUpdate = {$push: {refund:{staffCardId: staffCardData._id, paymentMethod: paymentMethod, price: price}}};

    returnData.dishesOrderId = dishesOrderData._id;
    returnData.recedeType = constant.PAYMENT_METHOD.CASH_PAY;
    returnData.price = price;


    //事务数据准备
    var array = [
        {
            collection: "dishesOrder",
            query: {_id: String(dishesOrderData._id)},
            update: dishesOrderUpdate
        },
        {
            collection: "restOrders",
            query:{_id: String(restOrderData._id)},
            update: orderUpdate
        }
    ];

    //是否要操作库存
    if(isSnack){
        array.push(
            {
                collection: "dishes",
                query: {_id: String(dishesOrderData.dishesId)},
                update: dishesUpdate
            }
        );
    }

    tran(array, function(err){
        if(err){
            callback(err);
        }else{
            dishesOrder.getDishesOrderByQuery({_id: dishesOrderData._id}, {}, function (err, dishesOrderData) {
                returnData.dishesOrderData = dishesOrderData;
                callback(err, returnData);
            });
        }
    });
}