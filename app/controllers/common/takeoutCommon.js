/**
 * 2015/2/2
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var push = require(BASEDIR + '/tools/push');
var tool = require(BASEDIR + '/tools/tool');
var restOrders = require(PROXY).restOrders;
var dishesOrder = require(PROXY).dishesOrder;
var staff = require(PROXY).staff;
var async = require('async');


/**
 * 确认订单
 * @param string orderId 要确认订单唯一_id
 * @param string cashierId 服务员唯一_id
 */
exports.confirm = function (orderId, cashierId, pattern, callback) {

    var serverUrl = '/server/order/takeOutOrder/affirmOrder';
    var data = {_id: orderId};
    var updateDishesOrder = {$set: {'pattern': pattern, 'isUpload': false}};
    var updateRestOrder = {$set: {'pattern': pattern, 'isUpload': false, 'deliverInfo.state': 2}};

    //如果是酒楼式快餐,上菜端必须要有台位号，要不上菜端报错
    if(pattern == 2){
        updateRestOrder.$set.foundingInfo = {diningTableName: '外卖'};
    }

    async.auto({
        getStaffInfo : function (cb) {
            var query = {_id: cashierId};
            staff.getStaffByQuery(query, {}, function (err, staffData) {
                if(err){
                    cb(err);
                }else{
                    if(staffData.length > 0){
                        cb(err, staffData[0]);
                    }else{
                        cb({message: "参数错误"});
                    }
                }
            })
        },
        getRestOrderInfo: function (cb) {
            var query = {_id: orderId, 'deliverInfo.state': 1};
            restOrders.getOneOrder(query, function (err, orderData) {
                if(err){
                    cb(err);
                }else{
                    if(tool.isObjectEmpty(orderData)){
                        cb({message: "参数错误或者订单已经确认"})
                    }else{
                        cb(err, orderData);
                    }
                }
            })
        },
        updateDishesOrders: ['getStaffInfo', 'getRestOrderInfo', function (cb, resultData) {

            updateRestOrder.$set.cashier = {name: resultData.getStaffInfo.userName, cashierId: resultData.getStaffInfo._id};


            dishesOrder.update({orderId: orderId}, updateDishesOrder, function (err) {
                cb(err);
            });
            //事务数据准备,事务对多条数据修改没有完善
            /*var array = [
                {
                    collection: "dishesOrder",
                    query: {orderId: String(orderId)},
                    update: updateDishesOrder
                },
                {
                    collection: "restOrders",
                    query:{_id: String(orderId)},
                    update: updateRestOrder
                }
            ];*/

            /*tran(array, function(err){
                cb(err);
            });*/
        }],
        updateRestOrder: ['updateDishesOrders', function (cb) {
            restOrders.updateRestOrders({_id: orderId}, updateRestOrder, function (err) {
                cb(err);
            });
        }]
    }, function (err, result) {
        if(err){
            dishesOrder.remove({orderId: orderId}, function (err) {
                console.log(err);
            });
            callback(err);
        }else{
            callback(null);
            //push.normalPushToSmall(serverUrl, data, callback);
            push.normalPushToSmall(serverUrl, data, function (err, body) {
            });
        }
    });
};

/**
 * 送出外卖
 */
exports.sendOut = function (orderId, callback) {
    var serverUrl = '/server/order/takeOutOrder/sendOutOrder';
    var data = {_id: orderId};
    var update = {$set: {'deliverInfo.state': 4, 'deliverInfo.isUrging': false, 'isUpload': false, 'ongoing':false}};
    var query = {_id: orderId, 'deliverInfo.state': {$in: [2,3]}};

    restOrders.getOneOrder(query, function (err, result) {
        if(err){
            callback(err);
        }else{
            if(tool.isObjectEmpty(result)){
                callback({message: "参数错误"})
            }else{
                restOrders.updateRestOrders(data, update, function (err) {
                        callback(err);
                        push.normalPushToSmall(serverUrl, data, function (err) {

                        });
                });
            }
        }
    });
};

/**
 * 完成外卖订单
 */
exports.finish = function (orderId, callback) {
    var serverUrl = '/server/order/takeOutOrder/finishOrder';
    var data = {_id: orderId};
    var update = {$set: {'deliverInfo.state': 6, 'isUpload': false, 'isDone': true, 'ongoing': false}};

    restOrders.updateRestOrders(data, update, function (err, result) {
            callback(err);

            push.normalPushToSmall(serverUrl, data, function (err) {

            });
    });

};

/**
 * 确认/拒绝 线上申退退单
 * @param data string 要退的订单ID
 * @param callback  fun 回调函数
 */
exports.onLineChangeBack = function (data, callback) {
    var serverUrl = '/server/order/takeOutOrder/onLineFeedbackOrder';
    var condition = {_id: data.orderId, backState: 1};
    var update = {$set: {'backState': data.state, 'onLineChangeBackApply.feedbackTime': new Date(), 'isUpload': false}};

    var sendData = {_id: String(data.orderId)};

    if(data.state == 2){
        update.$set.ongoing = false;
        update.$set.backTime = new Date();
        sendData.state = 1;
    }else{
        sendData.state = 2;
        sendData.repulseInfo = data.repulseInfo;
        update.$set['onLineChangeBackApply.repulseInfo'] = data.repulseInfo;
    }
    restOrders.updateRestOrders(condition, update, function (err, result) {

        if(err){
            callback(err);
        }else{
            if(tool.isObjectEmpty(result)){
                callback({message: "操作失败"});
            }else{
                callback(err);

                push.normalPushToSmall(serverUrl, sendData, function (err, result_small) {
                });
            }
        }

    });
};


/**
 * 线下退单
 * @param data
 * @param callback
 */
exports.offlineChangeBack = function (data, callback) {
    var serverUrl = '/server/order/takeOutOrder/offlineFeedbackOrder';
    var condition = {_id: data.orderId, backState: {$ne: 2}};
    var update = {$set: {'backState': 2, 'backTime': new Date(), 'isUpload': false, 'ongoing': false,  'offlineChangeBackApply.feedbackTime':
        new Date(), 'offlineChangeBackApply.repulseInfo': data.repulseInfo, 'offlineChangeBackApply.source': data.source}};

    restOrders.updateRestOrders(condition, update, function (err, result) {
        if(err){
            callback(err);
        }else{
            if(tool.isObjectEmpty(result)){
                callback({message: '操作失败'});
            }else{
                callback(err);

                var sendData = {
                    _id: String(data.orderId),                  // 订单ID
                    source: data.source		           // 退单申请来源(设定几个常用的退单申请，如：“电话协商”，“原料不足”)
                };
                push.normalPushToSmall(serverUrl, sendData, function (err) {

                });
            }
        }

    });

};