/**
 * 2014/11/12
 * @module /snack/
 * @description 酒楼快餐模式接口
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var validator = require('validator');
var tool = require(BASEDIR + '/app/common/utils/tool');
var payCommon = require(CONTROLLERS + '/common/payCommon');
var orderCommon = require(CONTROLLERS + '/common/orderCommon');
var cashierCommon = require(CONTROLLERS + '/common/cashierCommon');
var restOrders = require(PROXY).restOrders;
var dishesOrder = require(PROXY).dishesOrder;
var dishes = require(PROXY).dishes;
var saveSocket = require(CONTROLLERS + '/common/saveSocket');
var async = require('async');


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
    orderCommon.placeOrder(false, req.body, function (err, content) {
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
    orderCommon.placeAndPayOrder(false, constant.PATTERN.SNACK, req.body, function (err, content) {
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
 *  package:{ dishesId: '54d181078f8c27dc0782ab13',list: [ '54c889e1dd8872e425bfd14e', '54c88a37dd8872e425bfd158' ] }
 *  payment: '[{"paymentMethod":1,"price":26}]',
 *  isPack: 'false',
 *  cashierId: '9465465484sf46sd4f6s',
 *  totalPrice: '26.0'
 *  }
 */
router.post('/pay', function (req, res) {
    payCommon.checkData(false, req.body, function (err, result) {
        if (err) {
            return returnFAIL(res, err.message);
        } else {
            var data = result;
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
                'isPack': data.isPack,                  //是否打包
                'pattern': constant.PATTERN.SNACK       //快餐模式
            };
            if (data.diningMemberId) {
                newRestOrder.diningMemberId = data.diningMemberId;
                payCommon.memberPay(data, newRestOrder, constant.PATTERN.SNACK, function (err, content) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }else{
                        return returnSUCCESS(res, content);
                    }
                });

            } else {
                payCommon.otherPay(data, newRestOrder, constant.PATTERN.SNACK, function (err, content) {
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
 * 退菜接口
 */
router.post('/recedeDishes', function (req, res) {
    var dishesOrderId = req.body._id;
    var number = req.body.number;
    var operator = req.body.operator;
    cashierCommon.recedeDishes(true, dishesOrderId, operator, number, function (err, result) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            if(result.sendSocketToGoFood){
                for(var i in SOCKETS.goFood){
                    SOCKETIO.sockets.socket(SOCKETS.goFood[i].goFoodSocketId).emit('recedeDishesOk',{'ResultCode': 'SUCCESS', 'Result': result.dishesOrderData});
                }
            }
            if(result.sendSocketToPrepare){
                for(var j in SOCKETS.prepare){
                    SOCKETIO.sockets.socket(SOCKETS.prepare[j].prepareSocketId).emit('recedeDishesOk',{'ResultCode': 'SUCCESS', 'Result': result.dishesOrderData});
                }
            }

            return returnSUCCESS(res, {recedeType:result.recedeType, price: result.price, dishesOrderId: result.dishesOrderId});

        }
    })
});

/**
 * 通知备菜端和上菜端
 */
router.post('/sendOrderInfo', function (req, res) {
    var query = {};
    var params = tool.deleteNull(validator, req.body);
    if (params.orderId) {
        query.orderId = params.orderId;

        restOrders.updateRestOrders({_id: query.orderId, ongoing:false, isDone: false}, {$set: {ongoing: true}}, function (err, restOrderData) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                if(tool.isObjectEmpty(restOrderData)){
                    return returnFAIL(res, "操作失败");
                }else{
                    query.isPackage = false;
                    var prepareList = [];
                    dishesOrder.getSnackDishesOrder(query, function (err, list) {
                        if (err) {
                            return returnFAIL(res, err.message);
                        }else{
                            if(list.length > 0){
                                async.each(list, function(item, callback) {
                                    dishes.updateDishes({_id: item.dishesId._id}, {$inc: {salesVolume: item.quantity, haveOnNumber: item.quantity}}, function (err) {
                                        callback(err);
                                    });
                                }, function(err) {
                                    if(err){
                                        return returnFAIL(res, err.message);
                                    }else{
                                        for(var i in SOCKETS.goFood){
                                            SOCKETIO.sockets.socket(SOCKETS.goFood[i].goFoodSocketId).emit('getOrderInfo',{'ResultCode': 'SUCCESS', 'Result': list});
                                        }
                                        for(var j in SOCKETS.prepare){
                                            SOCKETIO.sockets.socket(SOCKETS.prepare[j].prepareSocketId).emit('newNeed',{'ResultCode': 'SUCCESS', 'Result': prepareList});
                                        }
                                        for (var g in SOCKETS.cashier) {
                                            SOCKETIO.sockets.socket(SOCKETS.cashier[g].cashierSocketId).emit('gAnds_getRestOrders', {'ResultCode': 'SUCCESS', 'Result': restOrderData});
                                        }
                                        return returnSUCCESS(res, "操作成功");
                                    }
                                });
                            }else{
                                return returnFAIL(res, "操作失败");
                            }
                        }
                    });
                }

            }
        });
    }else{
        return returnFAIL(res, "缺少参数");
    }
});

module.exports = router;