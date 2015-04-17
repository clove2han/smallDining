/**
 * 2014/11/12
 * @module /snack/
 * @description 酒楼快餐模式接口
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var validator = require('validator');
var tool = require(BASEDIR + '/tools/tool');
var payCommon = require(CONTROLLERS + '/common/payCommon');
var orderCommon = require(CONTROLLERS + '/common/orderCommon');
var cashierCommon = require(CONTROLLERS + '/common/cashierCommon');
var restOrders = require(PROXY).restOrders;
var dishesOrder = require(PROXY).dishesOrder;
var saveSocket = require(CONTROLLERS + '/common/saveSocket');
var async = require('async');
var emitQueue = require(BASEDIR + '/app/socketService/emitQueue');

/**
 * 保存收银端的socketId
 * @param string socketId
 * @param string cashierName
 */
router.post('/saveSocketId', function (req, res) {
    saveSocket.saveCashier(req.body, function (err) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, "保存成功");
        }
    });
});

/**
 * 点菜下单
 * {
 *  dishes: '[{"dishesId":"546f066a8b6b8a44240eefbf","quantity":1},{"dishesId":"547014fd30685ed0297a8a9a","quantity":1}]',
 *  package: '[{'dishesId': '', list:['', '']}]'
    "isPack": "false"
    ,"cashierId": "5459e6796ef3ef08482e4cdc"
    ,"totalPrice":"25"
    ,"diningTableName":"123"
 *  }
 */
router.post('/placeOrder', function(req, res){
    orderCommon.placeOrder(true, constant.PATTERN.GROG_SHOP_AND_SNACK, req.body, function (err, content) {
        if (err) {
            return returnFAIL(res, err.message);

        } else {
            return returnSUCCESS(res, content);
        }
    });
});

/**
 * 点菜下单
 * {
 *  dishes: '[{"dishesId":"546f066a8b6b8a44240eefbf","quantity":1},{"dishesId":"547014fd30685ed0297a8a9a","quantity":1}]',
 *  package: '[{'dishesId': '', list:['', '']}]'
    "isPack": "false"
    ,"cashierId": "5459e6796ef3ef08482e4cdc"
    ,"totalPrice":"25"
    ,"diningTableName":"123"
 *  }
 */
router.get('/testPlaceOrder', function(req, res){
    var params =
    {
        "isPack": "false"
        ,"cashierId": "5459e6796ef3ef08482e4cdc"
        ,"totalPrice":"25"
        ,"diningTableName":"123"
        ,"dishes":'[{"dishesId":"55078a0596326ef814cb82c8","quantity":"1"}]'
    };
    orderCommon.placeOrder(true, constant.PATTERN.GROG_SHOP_AND_SNACK, params, function (err, content) {
        if (err) {
            return returnFAIL(res, err.message);

        } else {
            return returnSUCCESS(res, content);
        }
    });
});

/**
 * 买单
 * {
 "_id": "5520ed3d4e0886cc210fac72"
 ,"discount": "1"
 ,"isFree":"false"
 ,"payment":"123"
 ,"diningMemberId":"123"
 ,"cashierId":"5459e6796ef3ef08482e4cdc"
 ,"diningMemberId":"5513f28ef811dd341a214b4a"
 , payment : '[{"paymentMethod":6,"price":25}]'
 *  }
 */
router.post('/payBill', function(req, res){
    //处理支付参数
    orderCommon.payBill(req.body, function (err, content) {
        if (err) {
            return returnFAIL(res, err.message);

        } else {
            return returnSUCCESS(res, content);
        }
    });
});

/**
 * 下单结账
 *  dishes: '[{"dishesId":"546f066a8b6b8a44240eefbf","quantity":1},{"dishesId":"547014fd30685ed0297a8a9a","quantity":1}]',
 *  package: '[{'dishesId': '', list:['', '']}]'
 "isPack": "false"
 ,"cashierId": "5459e6796ef3ef08482e4cdc"
 ,"totalPrice":"25"
 ,"diningTableName":"123"
 ,"discount": "1"
 ,"isFree":"false"
 ,"payment":"123"
 ,"diningMemberId":"5513f28ef811dd341a214b4a"
 , payment : '[{"paymentMethod":6,"price":25}]' *  }
 */
router.post('/placeAndPayOrder', function(req, res){
    console.log(req.body);
    orderCommon.placeAndPayOrder(true, constant.PATTERN.GROG_SHOP_AND_SNACK, req.body, function (err, content) {
        if (err) {
            return returnFAIL(res, err.message);

        } else {
            return returnSUCCESS(res, content);
        }
    });
});

/**
 * 点餐结账
 *@param json
 * {
 *  dishes: '[{"dishesId":"546f066a8b6b8a44240eefbf","quantity":1},{"dishesId":"547014fd30685ed0297a8a9a","quantity":1}]',
 *  package: '[{'dishesId': '', list:['', '']}]'
 *  payment: '[{"paymentMethod":1,"price":26}]',
 *  isPack: 'false',
 *  cashier: '许明达',
 *  totalPrice: '26.0'
 *  }
 */
router.post('/pay', function (req, res) {

    payCommon.checkData(true, req.body, function (err, result) {
        if (err) {
            return returnFAIL(res, err.message);
        } else {
            var data = result;
            console.log(data);

            if(data.restOrderData && !tool.isObjectEmpty(data.restOrderData)){
                //如果两次折扣不一样
                var discount = tool.toDecimal1Two((data.discount + data.restOrderData.discount)/2);

                var newRestOrder = {
                    query : {_id: data.restOrderData._id},
                    update: {$set: {
                        discount: discount
                    }, $inc: {
                        totalPrice: data.totalPrice,
                        discountPrice: data.discountPrice
                    }, $addToSet : {
                        payment: {$each: data.payment}
                    }}
                };

            }else{
                var newRestOrder = {
                    'orderNumber': tool.createOrderNumber(),
                    'orderState': constant.ORDER_STATE.ALREADY_PAY_BILL,
                    'orderType': constant.ORDER_TYPE.DINING,
                    'cashier': {cashierId: data.cashierId, name: data.cashierName},
                    'totalPrice': data.totalPrice,
                    'payment': data.payment,
                    'discount': data.discount,
                    'discountPrice': data.discountPrice,
                    'payDate': Date.now(),
                    'pattern': constant.PATTERN.GROG_SHOP_AND_SNACK,                           //酒楼快餐模式
                    'isPack': data.isPack,                  //是否打包
                    'foundingInfo.diningTableName': data.diningTableName
                };
            }

            if (data.diningMemberId) {
                newRestOrder.diningMemberId = data.diningMemberId;
                payCommon.memberPay(data, newRestOrder, constant.PATTERN.GROG_SHOP_AND_SNACK, function (err, content) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }else{
                        return returnSUCCESS(res, content);
                    }
                });

            } else {
                payCommon.otherPay(data, newRestOrder, constant.PATTERN.GROG_SHOP_AND_SNACK, function (err, content) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }else{
                        return returnSUCCESS(res, content);
                    }
                });

            }
        }
    });
});

/**
 * 通知厨房和上菜端
 */
router.post('/sendOrderInfo', function (req, res) {
    var query = {};
    var params = tool.deleteNull(validator, req.body);
    if (params.orderId) {
        query.orderId = params.orderId;
        async.waterfall([
            function (callback) {
                restOrders.getRestOrdersByQueryNoOpt({_id: query.orderId, isDone: false}, null, function(error, restOrderArray) {
                    if (error) {
                        callback(error);

                    } else if (restOrderArray && restOrderArray.length > 0) {
                        callback(null, restOrderArray);

                    } else {
                        callback({message: "操作失败"});
                    }
                });
            },
            function (restOrderArray, callback) {
                if(!restOrderArray[0].onGoing){
                    restOrders.updateRestOrders({_id: query.orderId}, {$set: {ongoing: true}}, function (err, restOrderData) {
                        if(err){
                            callback(err);
                        }else{
                            callback(null, restOrderData);
                        }
                    });
                }else{
                    callback(null,restOrderArray[0]);
                }
            },
            function (restOrderData, callback) {
                query.isPackage = false;
                dishesOrder.getDishesOrderByQuery(query, function (err, list) {
                    if (err) {
                        callback(err);

                    } else if(list && list.length > 0){
                        callback(null, restOrderData, list);

                    }else{
                        callback({message: "该订单没有点菜"});
                    }
                });
            }
        ], function (err, restOrderData, list) {
            if(err){
                return returnFAIL(res, err.message);

            }else{
                var kitchenList = [];           //发给厨师端
                var dishesData = {};
                list.forEach(function (item) {
                    if(item.state != constant.DISHES_STATE.HAVE_DONE){
                        kitchenList.push(dishesData);
                    }
                });
                for (var i in SOCKETS.goFood) {
                    SOCKETIO.sockets.socket(SOCKETS.goFood[i].goFoodSocketId).emit('gAnds_getOrderInfo', {'ResultCode': 'SUCCESS', 'Result': list});
                }
//                emitQueue.emit("kitchen", "gAnds_getDishesOrder", kitchenList);
                for (var j in SOCKETS.kitchen) {
                    SOCKETIO.sockets.socket(SOCKETS.kitchen[j].kitchenSocketId).emit('gAnds_getDishesOrder', {'ResultCode': 'SUCCESS', 'Result': kitchenList});
                }
                for (var g in SOCKETS.cashier) {
                    SOCKETIO.sockets.socket(SOCKETS.cashier[g].cashierSocketId).emit('gAnds_getRestOrders', {'ResultCode': 'SUCCESS', 'Result': restOrderData});
                }
                return returnSUCCESS(res, "成功");
            }
        });


    }else{
        return returnFAIL(res, "缺少参数");
    }
});

/**
 * 退菜接口
 */
router.post('/recedeDishes', function (req, res) {
    var dishesOrderId = req.body._id;
    var number = req.body.number;
    var operator = req.body.operator;
    cashierCommon.recedeDishes(false, dishesOrderId, operator, number, function (err, result) {
        if(err){
            return returnFAIL(res, err.message);
        }else{

            if(result.sendSocketToPrepare){
                for(var i in SOCKETS.kitchen){
                    SOCKETIO.sockets.socket(SOCKETS.kitchen[i].kitchenSocketId).emit('recedeDishesOk',{'ResultCode': 'SUCCESS', 'Result':result.dishesOrderData});
                }
            }
            if(result.sendSocketToGoFood){
                for(var j in SOCKETS.goFood){
                    SOCKETIO.sockets.socket(SOCKETS.goFood[j].goFoodSocketId).emit('recedeDishesOk',{'ResultCode': 'SUCCESS', 'Result': result.dishesOrderData});
                }
            }

            return returnSUCCESS(res, {recedeType:result.recedeType, price: result.price, dishesOrderId: result.dishesOrderId});
        }
    })
});


module.exports = router;