/**
 * 2015/1/24
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var async = require('async');
var validator = require('validator');
var tool = require(BASEDIR + '/tools/tool');
var restOrders = require(PROXY).restOrders;
var dishesOrder = require(PROXY).dishesOrder;
var pointsRule = require(PROXY).pointsRule;
var consumerLog = require(PROXY).consumerLog;
var diningMember = require(PROXY).diningMember;
var dishes = require(PROXY).dishes;
var staff = require(PROXY).staff;
var tran = require(BASEDIR + '/tools/transDelegated');

/**-------------------------------------------------------下单开始---------------------------------------------*/

/**
 * 点菜下单
 */
function placeOrder(hasTableName, pattern, placeData, callback){
//    placeData.dishes = '[{"dishesId":"55078a0596326ef814cb82c8","quantity":"1"}]';
    checkDataForPlaceOrder(hasTableName, placeData, function (err, result) {
        if (err) {
            callback(err);

        } else {
            createOrder(result, pattern, function (error, content) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, content);
                }
            });
        }
    });
}

/**
 * 酒楼式快餐和快餐模式的共有数据验证方法（下单）
 * @param hasTableName bool 是否有台位号
 * @param DataObj   json 数据对象
 *        {
 *          dishes: []
 *          ,package: []
 *          ,isPack: true/false                         是否打包
 *          ,cashierId: cashierId                       点菜员工ID
 *          ,totalPrice: totalPrice                     总价
 *          ,diningTableName: diningTableName           台位名称
 *        }
 * @param callback  function 回调函数
 */
function checkDataForPlaceOrder(hasTableName, DataObj, callback) {
    var params = tool.deleteNull(validator, DataObj);
    var data = {};
    if ((params.dishes || params.package) && (tool.isJson(params.dishes) || tool.isJson(params.package)) && params.isPack && params.cashierId && params.totalPrice && (hasTableName ? !tool.isNull(params.diningTableName): true)) {
        data.isPack = params.isPack;                                                    //是否打包
        data.totalPrice = tool.toDecimal1(parseFloat(Math.abs(params.totalPrice)));     //总价
        data.cashierId = params.cashierId;                                              //下单员工ID
        data.dishes = params.dishes?  JSON.parse(params.dishes) : [];                   //已点菜品
        data.package = params.package?  JSON.parse(params.package) : [];                //套餐菜品
        if(hasTableName) {
            data.diningTableName = params.diningTableName;                                  //台位名称
        }

        if(data.dishes.length <= 0 && data.package.length <=0){
            callback({message: "没有点菜"});

        }else{
            staff.getStaffByQuery({_id: data.cashierId, isDel:false}, function (err, staffData) {
                if (err) {
                    callback(err);

                } else if (staffData && staffData.length > 0){
                    data.cashierName = staffData[0].userName;
                    callback(null, data);

                }else {
                    callback({message: "没有找到服务员"});
                }
            });
        }
    } else {
        callback({message: "下单缺少参数"});
    }
}

/**
 * 下单
 * @param data json 过滤后的数据
 * @param pattern   int 模式(1.酒楼模式，2.酒楼快餐模式. 3.快餐模式)
 * @param callback  function 回调函数
 */
function createOrder(data, pattern, callback) {

    var newRestOrder = {
        'orderNumber': tool.createOrderNumber(),
        'orderState': constant.ORDER_STATE.WAIT_PAY_BILL,
        'orderType': constant.ORDER_TYPE.DINING,
        'totalPrice': data.totalPrice,
        'pattern': constant.PATTERN.GROG_SHOP_AND_SNACK,        //酒楼快餐模式
        'isPack': data.isPack,                                  // 是否打包
        'waiter': data.cashierName,                             // 点菜操作员
        'foundingInfo.diningTableName': data.diningTableName
    };

    restOrders.addRestOrders(newRestOrder, function (err, result) {
        if(err){
            callback(err);
        }else{
            var orderId = result._id;
            var content = {
                orderNumber: result.orderNumber,
                orderId: orderId,
                orderTime:result.createDate
            };

            createDishesOrder(data.dishes, data.package, orderId, data.cashierName, pattern, function(error){
                if(error){
                    callback(error);
                }else{
                    callback(null, content);
                }
            });
        }
    });
}

/**
 *
 * @param arr  array 已点的菜
 * @param package array 已点的套餐内容
 * @param orderId string 订单Id
 * @param cashierName string 点菜员的名字
 * @param pattern int 模式(1.酒楼模式，2.酒楼快餐模式. 3.快餐模式)
 * @param callback function 回调函数
 */
function createDishesOrder(arr, package, orderId, cashierName, pattern, callback){
    orderId = String(orderId);
    async.auto({
        normalDishesOrder: function (autoCallback) {
            if(arr && arr.length > 0){
                var dishesArray = [];
                //单点菜品
                async.each(arr, function(item, cb) {
                    dishes.getOneDishes({_id: item.dishesId}, function (err, dishesData) {
                        if(err){
                            cb(err);
                        }else{
                            if(tool.isObjectEmpty(dishesData)){
                                cb({message: "菜品不存在"});

                            }else{
                                var state = 0 , finishNumber = 0, isNeedCook = true;      //默认为待做菜 , 已做完的数量
                                if(dishesData.isNeedCook == false && (pattern == constant.PATTERN.GROG_SHOP || pattern == constant.PATTERN.GROG_SHOP_AND_SNACK)){     //如果菜品不需要经过厨房，则改为已做完
                                    finishNumber = item.quantity;
                                    state = constant.DISHES_STATE.HAVE_DONE;
                                    isNeedCook = false;
                                }
                                dishesArray.push({
                                    orderId: orderId,                           // 订单号
                                    dishTypeId: String(dishesData.typeId),      // 菜品类型ID
                                    dishesId: String(dishesData._id),           // 菜品ID
                                    pattern: pattern,
                                    waiter: cashierName,                        // 服务员(下单时生成)
                                    name: dishesData.name,                      // 菜品名称
                                    quantity: item.quantity,                    // 数量
                                    finishNumber: finishNumber,                 // 已经做完数量
                                    state: state,                               // 状态
                                    isNeedCook: isNeedCook,                     // 是否需要做菜
                                    price: dishesData.price                     // 单价
                                });
                                cb(null);
                            }
                        }
                    });
                }, function(err) {
                    if(err){
                        autoCallback(err);
                    }else{
                        dishesOrder.saveDishesOrders(dishesArray, function (err, docs) {
                            if(err){
                                dishesArray.forEach(function(item){
                                    dishesOrder.remove(item, function (err) {});
                                });
                                autoCallback(err);
                            }else{
                                autoCallback(null);
                            }
                        });
                    }
                });
            }else{
                autoCallback(null);
            }
        },
        packageDishesOrder: function (autoCallback) {
            //套餐菜品订单
            if(package && package.length > 0){
                async.each(package, function(row, eachCb){

                    dishes.getOneDishes({_id: row.dishesId}, function (err, packageData) {

                        if(tool.isObjectEmpty(packageData)){
                            eachCb({message: "套餐不存在"});
                        }else{
                            //开始循环插入数据
                            var packageDishesOrderIds = [];  //保存当前这个套餐所点的菜的dishesOrderId
                            async.each(row.list, function(item, cb) {
                                dishes.getOneDishes({_id: item}, function (err, dishesData) {
                                    if(err){
                                        cb(err);
                                    }else{
                                        if(tool.isObjectEmpty(dishesData)){
                                            cb({message: "菜品不存在"});
                                        }else{
                                            var state = 0 , finishNumber = 0, isNeedCook = true;      //默认为待做菜 , 已做完的数量
                                            if(dishesData.isNeedCook == false && (pattern == constant.PATTERN.GROG_SHOP_AND_SNACK || pattern == constant.PATTERN.GROG_SHOP)){     //如果菜品不需要经过厨房，则改为已做完
                                                state = constant.DISHES_STATE.HAVE_DONE;
                                                finishNumber = item.quantity;
                                                isNeedCook = false;
                                            }
                                            var newDishesOrder = {
                                                orderId: orderId,                       // 订单号
                                                dishTypeId: String(dishesData.typeId),  // 菜品类型ID
                                                dishesId: String(dishesData._id),       // 菜品ID
                                                pattern: pattern,
                                                waiter: cashierName,                    // 服务员(下单时生成)
                                                name: dishesData.name,                  // 菜品名称
                                                isDisplay: false,
                                                quantity: 1,                            // 数量
                                                finishNumber: finishNumber,             // 已做数量
                                                state: state,                           // 状态
                                                isNeedCook: isNeedCook,                 // 是否需要做菜
                                                price: 0                                // 单价
                                            };
                                            //插入数据
                                            dishesOrder.addDishesOrder(newDishesOrder, function (err, result) {
                                                if(err){
                                                    dishesOrder.remove(newDishesOrder, function (err) {});
                                                    cb(err);
                                                }else{
                                                    packageDishesOrderIds.push(result._id);
                                                    cb(err);
                                                }
                                            });
                                        }
                                    }
                                });
                            }, function(err) {
                                if(err){
                                    dishesOrder.remove({orderId: orderId}, function (err) {});
                                    restOrders.removeOneOrder({_id: orderId}, function (err) {});
                                    eachCb(err);

                                }else{
                                    var newDishesOrder = {
                                        orderId: orderId,                           // 订单号
                                        dishTypeId: String(packageData.typeId),     // 菜品类型ID
                                        dishesId: String(packageData._id),          // 菜品ID
                                        pattern: pattern,
                                        waiter: cashierName,                        // 服务员(下单时生成)
                                        name: packageData.name,                     // 菜品名称
                                        isPackage: true,
                                        packageContent: packageDishesOrderIds,
                                        quantity: 1,                                // 数量
                                        price: packageData.price                    // 单价
                                    };
                                    //插入数据
                                    dishesOrder.addDishesOrder(newDishesOrder, function (err) {
                                        eachCb(err);
                                    });
                                }
                            });
                        }
                    });
                }, function (err) {
                    autoCallback(err);
                });
            }else{
                autoCallback(null);
            }
        }
    }, function (err) {
        if(err){
            restOrders.removeOneOrder({_id: orderId}, function (err) {});
            callback(err);
        }else{
            callback(null);
        }
    });
}
/**-------------------------------------------------------下单结束---------------------------------------------*/



/**-------------------------------------------------------买单开始---------------------------------------------*/
/**
 * 买单
 */
function payBill(payData, callback){
//    payData.payment = '[{"paymentMethod":6,"price":25}]';
    //处理支付参数
    checkDataForPayBill(payData, function (err, result) {
        if (err) {
            callback(err);

        } else {
            //买单
            selectPayMode(result, function (error, content) {
                if(error){
                    callback(error);
                }else{
                    callback(null, content);
                }
            });
        }
    });
}

/**
 * 酒楼式快餐和快餐模式的共有数据验证方法(买单）
 * @param DataObj   json 数据对象
 * @param callback  function 回调函数
 */
function checkDataForPayBill(DataObj, callback) {
    var params = tool.deleteNull(validator, DataObj);
    var data = {}, memberPay = 0,  payTotalPrice = 0, refundPrice = 0, coupon = 0;
    if (params._id && params.payment && tool.isJson(params.payment) && params.cashierId) {

        restOrders.getRestOrdersById(params._id, null, function(error, doc){
            if(error){
                callback(error);

            }else if(doc && doc.orderState == constant.ORDER_STATE.WAIT_PAY_BILL){
                data._id = params._id;
                data.discount = !tool.isNull(params.discount) ? tool.toDecimal1Two(params.discount) : 1;    //折扣
                data.cashierId = params.cashierId;
                data.isFree = data.isFree ? true : false;

                var payment = JSON.parse(params.payment);
                if (payment.length <= 0) {
                    callback({message: "支付方式不能为空"})

                } else {
                    //算总价钱和折扣价钱
                    payment.forEach(function (item) {
                        payTotalPrice += item.price;
                        switch (item.paymentMethod) {
                            case constant.PAYMENT_METHOD.VOUCHER_PAY:
                                coupon = item.price;
                                break;
                            case constant.PAYMENT_METHOD.MEMBER_PAY:
                                memberPay = item.price;
                                break;
                            case constant.PAYMENT_METHOD.FREE_PAY:
                                memberPay = 0;
                                break;
                        }
                    });
                    //已退款
                    if(doc.refund && doc.refund.length > 0){
                        doc.refund.forEach(function(item){
                            refundPrice += item.price;
                        });
                    }
                    if (memberPay > 0) {
                        if(params.diningMemberId){
                            data.diningMemberId = params.diningMemberId;
                        }else{
                            callback({message: "缺少参数，没有会员信息"});
                        }
                    }

                    data.payment = payment;
                    data.memberPay = memberPay;
                    //实际价格 = 总价 * 折扣 - 退款金额 - 代金券

                    data.discountPrice = tool.toDecimal1((doc.totalPrice - refundPrice - coupon) * data.discount);
                    // 实际支付是否等于优惠的价格
                    if (tool.toDecimal1(payTotalPrice - coupon) != data.discountPrice) {
                        callback({message: "付款金额不正确"});
                    }else{
                        staff.getStaffByQuery({_id: data.cashierId}, function (err, staffData) {
                            if (err) {
                                callback(err);

                            } else if (staffData && staffData.length > 0){
                                data.cashierName = staffData[0].userName;
                                callback(null, data);

                            }else {
                                callback({message: "没有找到员工"});
                            }
                        });
                    }
                }
            }else{
                callback({message: "订单不存在或已结帐"});
            }
        });
    } else {
        callback({message: "买单缺少参数"});
    }
}

/**
 * 选择支付方式
 * @param data json 过滤后的数据
 * @param callback  function 回调函数
 */
function selectPayMode(data, callback) {
    //支付参数
    var payData = {
        'orderState': constant.ORDER_STATE.ALREADY_PAY_BILL,
        'cashier': {cashierId: data.cashierId, name: data.cashierName},
        'payment': data.payment,
        'discount': data.discount,
        'discountPrice': data.discountPrice,
        'payDate': Date.now()
    };

    if (data.diningMemberId) {
        //会员支付
        payData.diningMemberId = data.diningMemberId;
        memberPay(data, payData, function (err, content) {
            if(err){
                callback(err);
            }else{
                callback(null, content);
            }
        });

    } else {
        //其他支付方式
        otherPay(data._id, payData, function (err, content) {
            if(err){
                callback(err);
            }else{
                callback(null, content);
            }
        });

    }
}

/**
 * 其他支付
 * @param orderId 订单ID
 * @param payData json 支付对象
 * @param callback  function 回调函数
 */
function otherPay(orderId, payData, callback) {
    var query = {
        _id: orderId
    };
    restOrders.updateRestOrders(query, {$set: payData}, function (err, result) {
        if(err){
            callback(err);

        }else if(result){
            var content = {
                orderNumber: result.orderNumber,
                orderId: result._id,
                orderTime: result.createDate
            };
            callback(null, content);
        }else{
            callback({message: "订单不存在"});
        }
    });
}

/**
 * 会员支付
 * @param data json 过滤后的数据
 * @param payData json 支付参数
 * @param callback function 回调函数
 */
function memberPay(data, payData, callback){
    var arrayData = [], consumerObj = {};
    async.waterfall([
        //积分规则
        function (cb) {
            pointsRule.getLastPointsRule(function (err, result) {
                if(err){
                    cb(err);
                }else{
                    //积分与金额的比率
                    if(result.length > 0){
                        var rate = parseFloat(result[0].returnPoints / result[0].consumer);
                        payData.backPoints = Math.round(data.memberPay * rate);
                    }else{
                        payData.backPoints = 0;
                    }
                    cb(null);
                }
            });
        },
        //会员信息
        function (cb) {
            diningMember.getMemberByQuery({_id: payData.diningMemberId}, null, function (err, memberData) {
                if(err){
                    cb(err);
                }else{
                    //判断是否有足够的金额支付
                    if(memberData.length > 0){
                        if(memberData[0].prepayments + memberData[0].giveMoney >= data.memberPay){
                            if(memberData[0].prepayments >= data.memberPay){
                                consumerObj.price = data.memberPay;
                                consumerObj.giveMoney = 0;
                            }else{
                                consumerObj.price = memberData[0].prepayments;
                                consumerObj.giveMoney = data.memberPay - memberData[0].prepayments;
                            }
                            cb(null);
                        }else{
                            cb({message: "余额不足"});
                        }
                    }else{
                        cb({message: "会员不存在"});
                    }
                }
            });
        },
        function (cb) {
            //事务准备数据
            arrayData.push({
                collection:"diningMember",
                query:{_id: String(payData.diningMemberId)},
                update:{$inc: {prepayments: -consumerObj.price, giveMoney: -consumerObj.giveMoney, points: payData.backPoints}}
            });

            tran(arrayData, function(err){
                cb(err);
            });
        },
        function (cb) {
            //其他支付
            otherPay(data._id, payData, function(error, doc){
                    cb(error, doc);
            });
        }
    ], function (err, result) {
        if(err){
            callback(err);
        }else{
            //添加消费记录
            var newConsumer = {
                diningMemberId : data.diningMemberId,        // 会员ID
                points : 0,
                consumer : consumerObj.price,                // 消费金额
                giveMoney : consumerObj.giveMoney,           // 消费赠送
                restOrdersId : data._id                       // 订单Id
            };
            consumerLog.addOneConsumer(newConsumer, function (err) {
                if (err) {
                    //添加消费记录出错回滚
                    console.log(err);
                }
            });
            callback(null, result);
        }
    });
}

/**-------------------------------------------------------买单结束---------------------------------------------*/

/**-------------------------------------------------------下单并支付 START---------------------------------------------*/
function placeAndPayOrder(hasTableName, pattern, orderData, cb){
//    orderData.dishes = '[{"dishesId":"55078a0596326ef814cb82c8","quantity":"1"}]';
//    orderData.payment = '[{"paymentMethod":6,"price":25}]';

    async.waterfall(
        [
            function (callback) {
                //验证下单数据
                checkDataForPlaceOrder(hasTableName, orderData, function (err, result) {
                    if (err) {
                        callback(err);

                    } else {
                        callback(null, result);
                    }
                });
            },
            function (result, callback) {
                //下单
                createOrder(result, pattern, function (error, doc) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, doc);
                    }
                });
            },
            function (doc, callback) {
                orderData._id = doc.orderId;
                //验证买单数据
                checkDataForPayBill(orderData, function (err, result) {
                    if (err) {
                        callback(err);

                    } else {
                        callback(null, result);
                    }
                });
            },
            function (result, callback) {
                //买单
                selectPayMode(result, function (error, content) {
                    if(error){
                        callback(error);
                    }else{
                        callback(null, content);
                    }
                });
            }
        ], function (err, result) {
            if(err){
                if(orderData._id){
                    //事务失败
                    restOrders.removeOneOrder({_id: orderData._id}, function (err) {
                        console.log(err);
                    });
                    dishesOrder.remove({orderId: orderData._id}, function (err) {
                        console.log(err);
                    });
                }
                cb(err);
            }else{
                cb(null, result);
            }
        }
    );
}

/**-------------------------------------------------------下单并支付 END---------------------------------------------*/

exports.placeOrder = placeOrder;                          //点菜下单
exports.payBill = payBill;                                //买单
exports.placeAndPayOrder = placeAndPayOrder;              //下单支付
exports.createDishesOrder = createDishesOrder;            //添加菜品订单