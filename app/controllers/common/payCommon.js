/**
 * 2015/1/24
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var async = require('async');
var validator = require('validator');
var tool = require(BASEDIR + '/app/common/utils/tool');
var restOrders = require(PROXY).restOrders;
var dishesOrder = require(PROXY).dishesOrder;
var pointsRule = require(PROXY).pointsRule;
var consumerLog = require(PROXY).consumerLog;
var diningMember = require(PROXY).diningMember;
var dishes = require(PROXY).dishes;
var staff = require(PROXY).staff;
var tran = require(BASEDIR + '/app/common/utils/transDelegated');


/**
 * 酒楼式快餐和快餐模式的共有数据验证方法
 * @param hasTableName bool 是否有台位号
 * @param DataObj   json 数据对象
 * @param callback  function 回调函数
 */
function checkData(hasTableName, DataObj, callback) {

    var params = tool.deleteNull(validator, DataObj);
    console.log("参数: " + params);
    var data = {}, coupon = 0, memberPay = 0,  payTotalPrice = 0;

    //支付方式
    if (params.payment && (params.dishes || params.package) && params.cashierId && params.isPack && params.totalPrice && (hasTableName ? params.diningTableName: true)) {

        data.isPack = params.isPack;                     //是否打包
        //data.isInvoice = params.isInvoice;               //是否开发票
        data.totalPrice = tool.toDecimal1(parseFloat(Math.abs(params.totalPrice)));

        data.cashierId = params.cashierId;
        if(hasTableName){
            data.diningTableName = params.diningTableName;
//            如果有台位号的，先去查看该台位的订单是否正在进行中,如果订单正在进行中和未完成的状态下就认为是加菜
//            var query = {'foundingInfo.diningTableName': data.diningTableName, isDone: false, ongoing: true};
//            restOrders.getOneOrder(query, function (err, restOrderData) {
//                if(err){
//                    callback(err);
//                }else{
//                    if(!tool.isObjectEmpty(restOrderData)){
//                        data.restOrderData = restOrderData;
//                    }
//                }
//            });
        }

        console.log("折扣: " + params.discount);
        //折扣
        data.discount = params.discount ? tool.toDecimal1Two(params.discount) : 1;

        staff.getStaffByQuery({_id: data.cashierId}, function (err, staffData) {
            if (err) {
                callback(err);
            } else {
                if (staffData.length > 0) {
                    data.cashierName = staffData[0].userName;

                    if (tool.isJson(params.payment) && (tool.isJson(params.dishes)) || tool.isJson(params.package)) {
                        var payment = JSON.parse(params.payment);

                        if(params.dishes){
                            data.dishes = JSON.parse(params.dishes);
                        }else{
                            data.dishes = [];
                        }

                        if(params.package){
                            data.package = JSON.parse(params.package);
                        }else{
                            data.package = [];
                        }


                        if (payment.length <= 0) {

                            callback({message: "参数有误005"})
                        } else {
                            //算总价钱和折扣价钱
                            payment.forEach(function (item) {
                                payTotalPrice += item.price;
                                switch (item.paymentMethod) {
                                    case 5:
                                        coupon = item.price;
                                        break;
                                    case 6:
                                        memberPay = item.price;
                                        break;
                                    case 8:
                                        memberPay = 0;
                                        break;
                                }
                            });

                            if (memberPay > 0) {
                                if(params.diningMemberId){
                                    data.diningMemberId = params.diningMemberId;
                                }else{
                                    callback({message: "参数有误004"});
                                }
                            }
                            data.payment = payment;
                            data.memberPay = memberPay;
                            data.discountPrice = tool.toDecimal1((data.totalPrice - coupon) * data.discount);



                            // 实际支付是否等于优惠的价格
                            if (tool.toDecimal1(payTotalPrice - coupon) != data.discountPrice) {
                                callback({message: "参数有误003"});
                            } else {

                                callback(null, data);
                            }
                        }

                    } else {
                        callback({message: "参数有误002"});
                    }
                } else {
                    callback({message: "参数有误001"});
                }
            }
        })
    } else {
        callback({message: "缺少参数"});
    }
}

/**
 * 其他支付
 * @param data json 过滤后的数据
 * @param newRestOrder  json 新订单准备的数据
 * @param pattern   int 模式(1.酒楼模式，2.酒楼快餐模式. 3.快餐模式)
 * @param callback  function 回调函数
 */
function otherPay(data, newRestOrder, pattern, callback) {

    if(data.restOrderData && !tool.isObjectEmpty(data.restOrderData)){
        var query = newRestOrder.query;
        var update = newRestOrder.update;
        restOrders.updateRestOrders(query, update, function (err, result) {
            if(err){
                callback(err);
            }else{
                var content = {
                    orderNumber: result.orderNumber,
                    orderId: result._id,
                    orderTime: result.createDate
                };

                createDishesOrder(data.dishes, data.package, result._id, data.cashierName, content, pattern, callback);
            }
        });
    }else{
        restOrders.addRestOrders(newRestOrder, function (err, result) {
            if(err){
                callback(err);
            }else{

                var orderId = result._id;
                var content = {
                    orderNumber: result.orderNumber,
                    orderId: orderId,
                    orderTime: result.createDate
                };

                createDishesOrder(data.dishes, data.package, orderId, data.cashierName, content, pattern, callback);
            }
        });
    }
}

/**
 * 会员支付
 * @param data json 过滤后的数据
 * @param newRestOrder  json 新订单准备的数据
 * @param pattern int 模式(1.酒楼模式，2.酒楼快餐模式. 3.快餐模式)
 * @param callback function 回调函数
 */
function memberPay(data, newRestOrder, pattern, callback){
    var arrayData = [], orderId = "", consumerObj = {};
    async.auto({
        //积分规则
        getPointsRule: function (cb) {
            pointsRule.getLastPointsRule(function (err, result) {
                if(err){
                    cb(err);
                }else{
                    //积分与金额的比率
                    if(result.length > 0){
                        var rate = parseFloat(result[0].returnPoints / result[0].consumer);
                        newRestOrder.backPoints = Math.round(data.memberPay * rate);
                    }else{
                        newRestOrder.backPoints = 0;
                    }
                    cb(null);
                }
            });
        },
        //会员信息
        getMemberInfo: function (cb) {
            diningMember.getMemberByQuery({_id: newRestOrder.diningMemberId}, null, function (err, memberData) {
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
        createRestOrder: ['getPointsRule', 'getMemberInfo', function (cb) {

            otherPay(data, newRestOrder, pattern, cb);
        }],
        waitCreateRestOrder: ['createRestOrder', function (cb, result) {

            orderId = result.createRestOrder.orderId;
            //事务准备数据
            arrayData.push({
                collection:"diningMember",
                query:{_id: String(newRestOrder.diningMemberId)},
                update:{$inc: {prepayments: -consumerObj.price, giveMoney: -consumerObj.giveMoney, points: newRestOrder.backPoints}}
            });

            tran(arrayData, function(err, transactionId){
                if(err){
                    //事务失败
                    restOrders.removeOneOrder({_id: orderId}, function (err) {
                        console.log(err);
                    });
                    dishesOrder.remove({orderId: orderId}, function (err) {
                        console.log(err);
                    });

                    cb(err);
                }else{
                    cb(err, transactionId);
                }
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
                consumer : consumerObj.price,                // 消费金额
                giveMoney : consumerObj.giveMoney,           // 消费赠送
                restOrdersId : orderId                       // 订单Id
            };
            consumerLog.addOneConsumer(newConsumer, function (err) {
                if (err) {
                    //添加消费记录出错回滚
                    console.log(err);
                }
            });
            callback(null, result.createRestOrder, result.waitCreateRestOrder);
        }
    });
}

/**
 *
 * @param arr   array 已点的菜
 * @param package   array 已点的套餐内容
 * @param orderId   string 订单Id
 * @param cashierName string 点菜员的名字
 * @param content json 要返回的数据
 * @param pattern int 模式(1.酒楼模式，2.酒楼快餐模式. 3.快餐模式)
 * @param callback function 回调函数
 */
function createDishesOrder(arr, package, orderId, cashierName, content, pattern, callback){
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
                                var state = 0 , finishNumber = 0;      //默认为待做菜 , 已做完的数量
                                if(dishesData.isNeedCook == false && (pattern == 1 || pattern == 2)){     //如果菜品不需要经过厨房，则改为已做完
                                    finishNumber = item.quantity;
                                    state = 3;
                                }
                                dishesArray.push({
                                    orderId: orderId,                           // 订单号
                                    dishTypeId: String(dishesData.typeId),      // 菜品类型ID
                                    dishesId: String(dishesData._id),           // 菜品ID
                                    pattern: pattern,
                                    waiter: cashierName,                        // 服务员(下单时生成)
                                    name: dishesData.name,                      // 菜品名称
                                    quantity: item.quantity,                    // 数量
                                    finishNumber: finishNumber,                             // 已经做完数量
                                    state: state,                               // 状态
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
                        dishesOrder.saveDishesOrders(dishesArray, function (err) {
                            if(err){
                                restOrders.removeOneOrder({_id: orderId}, function (err) {});
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
                                            var state = 0 , finishNumber = 0;      //默认为待做菜 , 已做完的数量
                                            if(dishesData.isNeedCook == false && (pattern == 2 || pattern == 1)){     //如果菜品不需要经过厨房，则改为已做完
                                                state = 3;
                                                finishNumber = item.quantity;
                                            }
                                            var newDishesOrder = {
                                                orderId: orderId,                   // 订单号
                                                dishTypeId: String(dishesData.typeId),      // 菜品类型ID
                                                dishesId: String(dishesData._id),           // 菜品ID
                                                pattern: pattern,
                                                waiter: cashierName,                // 服务员(下单时生成)
                                                name: dishesData.name,              // 菜品名称
                                                isDisplay: false,
                                                quantity: 1,                        // 数量
                                                finishNumber: finishNumber,                     // 已做数量
                                                state: state,                       // 状态
                                                price: 0                            // 单价
                                            };
                                            //插入数据
                                            dishesOrder.addDishesOrder(newDishesOrder, function (err, result) {
                                                if(err){
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
                                        orderId: orderId,                   // 订单号
                                        dishTypeId: String(packageData.typeId),      // 菜品类型ID
                                        dishesId: String(packageData._id),           // 菜品ID
                                        pattern: pattern,
                                        waiter: cashierName,                // 服务员(下单时生成)
                                        name: packageData.name,              // 菜品名称
                                        isPackage: true,
                                        packageContent: packageDishesOrderIds,
                                        quantity: 1,                        // 数量
                                        price: packageData.price            // 单价
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
            callback(err);
        }else{
            callback(null, content);
        }
    });
}


exports.checkData = checkData;
exports.createDishesOrder = createDishesOrder;
exports.memberPay = memberPay;
exports.otherPay = otherPay;
