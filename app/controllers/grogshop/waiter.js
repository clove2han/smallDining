/**
 * 2014/10/17
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var validator = require('validator');
var dishes = require(PROXY).dishes;
var tool = require(BASEDIR + '/tools/tool');
var restOrders = require(PROXY).restOrders;
var dishesOrder = require(PROXY).dishesOrder;
var table = require(PROXY).table;
var async = require('async');
var tran = require(BASEDIR + '/tools/transDelegated');
var saveSocket = require(CONTROLLERS + '/common/saveSocket');
var staff=require(PROXY).staff;
var flavor=require(PROXY).flavor;
var orderCommon = require(CONTROLLERS + '/common/orderCommon');


/**
 * 保存服务员端的socketId
 */
router.post('/saveSocketId', function (req, res) {
    saveSocket.saveWaiter(req.body, function (err) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, "保存成功");
        }
    });
});

/**
 * 开台操作 
 * @param  {[type]} req  [description]
 * @param  {[type]} res
 * @return {[type]}      [description]
 */
router.post('/openTable', function  (req, res) {
    var params = deleteNull(validator, req.body);

    if (!params.tableId || !params.mealsNumber || !params.tableName || !params.waiterId) {
        return returnFAIL(res, "缺少参数");
    }

    var condition = {}, update = {};
    staff.getStaffByQuery({_id: params.waiterId, isDel:false}, function (err, staffData) {
        if (err) {
            return returnFAIL(res, err.message);

        } else if (staffData && staffData.length > 0){
            var newRestOrder = {
                orderNumber: tool.createOrderNumber(),  //订单号
                orderType: 1,                           //餐厅就餐类型
                pattern: 1,                             //酒楼模式
                ongoing: true,
                waiterName: staffData[0].userName,      //服务员名称
                foundingInfo:{                          //对应台位信息
                    foundingTime: new Date(),
                    diningTableId: params.tableId,
                    mealsNumber: parseInt(params.mealsNumber),
                    diningTableName: params.tableName
                }
            };

            restOrders.addRestOrders(newRestOrder, function (err, result) {
                if(err){
                    return returnFAIL(res, err.message);
                }else{
                    condition._id = params.tableId;
                    update.$set = {
                        state: 3,
                        mealsNumber: parseInt(params.mealsNumber),
                        orderId: result._id,
                        openDate: new Date()
                    };

                    table.updateTable(condition, update, function  (err, tableDoc) {
                        if (err) {
                            return returnFAIL(res, err.message);
                        }else{
                            var data = {
                                _id: tableDoc._id,
                                mealsNumber: tableDoc.mealsNumber,
                                state: tableDoc.state,
                                openDate: tableDoc.openDate,
                                orderId: tableDoc.orderId
                            };

                            SOCKETIO.sockets.emit('getState', {'ResultCode': 'SUCCESS', 'Result': data});
                            return returnSUCCESS(res, "success");
                        }
                    });

                }
            });

        }else {
            return returnFAIL(res, "没有找到服务员");
        }
    });
});

/**
 * 取消开台操作
 */
router.post('/cancelOpenTable', function  (req, res) {
    var tableId = req.body.tableId;
    var orderId = req.body.orderId;

    if (!tableId || !orderId) {
        return returnFAIL(res, "缺少参数");
    }
    
    var condition = {}, update = {};
    condition._id = tableId;
    condition.state = 3;
    update.$set = {
        orderId: "",
        state: 1,
        mealsNumber: 0
    };

    table.updateTable(condition, update, function  (err, tableDoc) {
        
        if (err) {
            return returnFAIL(res, err.message);
        }else{
            restOrders.removeOneOrder({_id: orderId}, function  (err) {

                if (err) {
                    return returnFAIL(res, err.message);
                }else{

                    var data = {
                        _id: tableId,
                        state: 1,
                        mealsNumber: 0,
                        orderId: ""
                    };

                    SOCKETIO.sockets.emit('getState', {'ResultCode': 'SUCCESS', 'Result': data});
                    return returnSUCCESS(res, 'success');
                }
            });
        }
    });
});

/**
 * 45678及翻台状态的操作
 * @return {[type]}               [description]
 */
router.post('/otherStateAction', function  (req, res) {
    var t = {};

    if(req.body.tableId){
        var tableId = req.body.tableId;
    }else{
        return returnFAIL(res, "缺少台Id");
    }

    if(req.body.state){
        var state = parseInt(req.body.state);
    }else{
        return returnFAIL(res, "缺少台状态");
    }

    var orderId = "";
    if(req.body.orderId){
        orderId = req.body.orderId;
    }

    var query = {_id: tableId};
    var update = {$set: {state: state}};
    switch (state){
        case 1:
            if(orderId){
                //非正常翻台
                //1进行所点的菜是否都退完
                //2更改订单状态为已退
                //3进行台状态更改
                var hasDishes = false;
                dishesOrder.getDishesOrder({orderId: orderId}, function (err, dishesOrderData) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }else{
                        if(dishesOrderData.length > 0){
                            dishesOrderData.forEach(function (item) {
                                if(item.quantity != item.recedeNum){
                                    hasDishes = true;
                                }
                            });

                            if(hasDishes){
                                return returnFAIL(res, "该台还有订单未完成");
                            }
                        }

                        restOrders.updateRestOrders({_id: orderId}, {$set: {backState:2}}, function(err){
                           if(err){
                               return returnFAIL(res, err.message);
                           }else{
                               update.$set = {
                                   orderId: "",
                                   state: 1,
                                   mealsNumber: 0
                               };
                           }
                        });

                    }
                });

            }else{
                query.state = 8;
                update.$set = {
                    orderId: "",
                    state: 1,
                    mealsNumber: 0
                };
            }
            break;
        case 8:
            query.state = 7;
            break;
    }

    table.updateTable(query, update, function (err, tableDoc) {
        if(err){
            socket.emit('error', {'ResultCode': 'FAIL', 'Result': err.message});
            return returnFAIL(res, err.message);
        }else{
            if(tableDoc){
                var data = {
                    _id: tableDoc._id,
                    state: tableDoc.state,
                    mealsNumber: tableDoc.mealsNumber,
                    orderId: tableDoc.orderId,
                    openDate: tableDoc.openDate
                };

                SOCKETIO.sockets.emit('getState', {'ResultCode': 'SUCCESS', 'Result': data});
                return returnSUCCESS(res, '操作成功');

            }else{
                return returnFAIL(res, "操作失败");
            }
        }
    });

});


/**
 * 换台
 * 把前一张台的订单号转为后一张台(必须为空闲状态)的订单号，并把前一张台状态改为空闲订单号为空
 */
router.post('/exchange', function (req, res) {
    //oldTableId  newTableId
    var params = deleteNull(validator, req.body);

    if(params.oldTableId && params.newTableId){
        var oldTableQuery = {_id: params.oldTableId};
        var newTableQuery = {_id: params.newTableId};
    }else{
        return returnFAIL(res, "缺少参数");
    }

    var oldTableData = {}, newTableData = {};
    //查询两张台的信息进行判断是否可以换台
    async.auto({
        getOldTableInfo: function (callback) {
            table.getTableByQuery(oldTableQuery, {}, function(err, tableData){
                if(err){
                    callback(err)
                }else{
                    if(tableData.length > 0){
                        if(tableData[0].state < 3){
                            callback({message: "原台位状态下不可以换台"});
                        }else{
                            callback(null, tableData[0]);
                        }
                    }else{
                        callback({message: "没有找到原台位"});
                    }
                }
            })
        },
        getNewTableInfo: function (callback) {
            table.getTableByQuery(newTableQuery, {}, function(err, tableData){
                if(err){
                    callback(err)
                }else{
                    if(tableData.length > 0){
                        if(tableData[0].state == 1){
                            callback(null, tableData[0]);
                        }else{
                            callback({message: "新台位状态不是空闲"});

                        }
                    }else{
                        callback({message: "没有找到新台位"});
                    }
                }
            })
        },
        getRestOrdersInfo: ['getOldTableInfo', 'getNewTableInfo',function(callback, results){
            var orderId = results.getOldTableInfo.orderId;
            restOrders.getOneOrder({_id: orderId}, function (err, data) {
                callback(err, data);
            })
        }],
        startTrans: ['getRestOrdersInfo', function(callback, results) {
                var orderId = results.getOldTableInfo.orderId;
                var state = results.getOldTableInfo.state;
                var mealsNumber = results.getOldTableInfo.mealsNumber;
                var openDate = results.getOldTableInfo.openDate;
                var diningTableName = results.getNewTableInfo.name;
                var diningTableId = results.getNewTableInfo._id;
                var restOrderUpdate =  {$set: {
                    foundingInfo:{
                        diningTableId: diningTableId,
                        diningTableName: diningTableName,
                        foundingTime: openDate,
                        mealsNumber: mealsNumber
                    }
                }};
                //事务数据准备，要把修改的内容放进去就可以了
                var array = [
                    {collection: "table", query: oldTableQuery, update:{$set: {state: 1, orderId: "", mealsNumber: 0}}},
                    {collection: "table", query: newTableQuery, update:{$set: {state: state, orderId: orderId, mealsNumber: mealsNumber, openDate:openDate}}},
                    {collection: "restOrders", query: {_id: orderId}, update: restOrderUpdate}
                ];

                oldTableData = {
                    _id: oldTableQuery._id,
                    state: 1,
                    mealsNumber: 0,
                    orderId: ""
                };

                newTableData = {
                    _id: newTableQuery._id,
                    state: state,
                    mealsNumber: mealsNumber,
                    orderId: orderId,
                    openDate: openDate
                };

                tran(array, function(err){
                    callback(err);
                });

        }]
    }, function(err, result) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            for(var i in SOCKETS.waiter){
                SOCKETIO.sockets.socket(SOCKETS.waiter[i].waiterSocketId).emit('getState',{'ResultCode': 'SUCCESS', 'Result': oldTableData});
                SOCKETIO.sockets.socket(SOCKETS.waiter[i].waiterSocketId).emit('getState',{'ResultCode': 'SUCCESS', 'Result': newTableData});
            }
            for(var j in SOCKETS.queues){

                SOCKETIO.sockets.socket(SOCKETS.queues[j].queueSocketId).emit('getState',{'ResultCode': 'SUCCESS', 'Result': oldTableData});
                SOCKETIO.sockets.socket(SOCKETS.queues[j].queueSocketId).emit('getState',{'ResultCode': 'SUCCESS', 'Result': newTableData});
            }
            for(var v in SOCKETS.cashier){

                SOCKETIO.sockets.socket(SOCKETS.cashier[v].cashierSocketId).emit('getState',{'ResultCode': 'SUCCESS', 'Result': oldTableData});
                SOCKETIO.sockets.socket(SOCKETS.cashier[v].cashierSocketId).emit('getState',{'ResultCode': 'SUCCESS', 'Result': newTableData});
            }
            for(var k in SOCKETS.kitchen){
                //订单号，和新的台号
                SOCKETIO.sockets.socket(SOCKETS.kitchen[k].kitchenSocketId).emit('exchangeTable',{'ResultCode': 'SUCCESS', 'Result': {orderId: result.getOldTableInfo.orderId, tableName: result.getNewTableInfo.name}});
            }
            return returnSUCCESS(res, "操作成功");
        }
    });
});


/**
 * 获得对应分类的菜品
 */
router.post('/getDishes', function (req, res) {
    var query = {};
    query.typeId = validator.escape(req.body.typeId).trim();

    var displayField = "name abbr imgName price salePrice saleType state surplus sort flavorId";
    dishes.getDishesByQuery(query, null, function (err, dishesData) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, dishesData);
        }
    }, displayField);
});

/**
 * 开台点菜时进行对台的状态检测
 * 主要作用：
 *      A服务员正在开1号台,然后A服务员进入1号台点菜界面,
 * B服务员在A开台瞬间点击取消开台按钮,台位变成空闲,
 * A服务员点菜提交后,台位状态又变成了点菜中,
 * 但是菜品拿不到,还会引起A和B程序死亡
 */
router.post('/checkTableByOrderDishes', function(req, res){
    var tableId = "", socketId = "", isQuery = true, isAction = true;

    if(req.body.tableId && req.body.socketId){
        tableId = validator.escape(req.body.tableId).trim();
        socketId = validator.escape(req.body.socketId).trim();
    }else{
        return returnFAIL(res, '缺少参数');
    }
    //先进行是否已经绑定查询
    //当app异常退到主界面，但没有死掉时，再进行对该台进行操作时候会起作用
    if(BINDTABLE){
        BINDTABLE.forEach(function(item, index){
            //判断该台位是否被其他人操作
            if(item.tableId == tableId){
                isQuery = false;
                if(item.waiterSocketId == socketId){
                    isAction = true;
                }else{
                    isAction = false;
                }
            }
        });
    }

    if(isQuery){
        table.getTableByQuery({_id: tableId}, {state:1}, function(err, tableData){
            if(err){
                return returnFAIL(res, err.message);
            }else{
                if(tableData.length > 0 && tableData[0].state >= constant.TABLE_STATE.RESERVATION){
                    if(BINDTABLE){
                        BINDTABLE.push({tableId: tableId, waiterSocketId: socketId});
                    }
                    return returnSUCCESS(res, {isAction: isAction});
                }else{
                    return returnFAIL(res, "操作失败");
                }
            }
        });
    }else{
        return returnSUCCESS(res, {isAction: isAction});
    }
});

/**
 * 取消台与操作员绑定
 */
router.post('/cancelTableBind', function(req, res){
    var tableId = "", socketId = "";

    if(req.body.tableId && req.body.socketId){
        tableId = validator.escape(req.body.tableId).trim();
        socketId = validator.escape(req.body.socketId).trim();
    }else{
        return returnFAIL(res, '缺少参数');
    }

    BINDTABLE.forEach(function (item, index) {
        if(item.waiterSocketId == socketId && item.tableId == tableId){
            BINDTABLE.splice(index,1);
        }
    });

    return returnSUCCESS(res, "操作成功");
});


/**
 * 退菜
 */
router.post('/recede', function(req, res){
    var query = {};
    var params = deleteNull(validator, req.body);

    if(params._id && params.quantity){
        query._id = params._id;
    }else{
        return returnFAIL(res, "操作失败");
    }

    dishesOrder.getDishesOrderByQuery(query, {}, function (err, doc) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            if(doc.length > 0){
                //现在要退的数量与已经退过的数量加起来比较点的数量
                var totalRecedeNum = parseInt(params.quantity) + parseInt(doc[0].recedeNum);

                if(doc[0].quantity >= totalRecedeNum){
                    var update = {$inc:{recedeNum: params.quantity}};

                    if(doc[0].quantity == totalRecedeNum){
                        update.$set = {state: constant.DISHES_STATE.REFUND_FULL};
                    }

                    dishesOrder.updateDishesOrder(query, update, function (err) {
                        if(err){
                            return returnFAIL(res, err.message);
                        }else{
                            //退菜时通知所有服务员端及厨师端
                            for(var i in SOCKETS.waiter){
                                SOCKETIO.sockets.socket(SOCKETS.waiter[i].waiterSocketId).emit('recede',{'ResultCode': 'SUCCESS', 'Result': params});
                            }
                            for(var j in SOCKETS.kitchen){
                                SOCKETIO.sockets.socket(SOCKETS.kitchen[j].kitchenSocketId).emit('recede',{'ResultCode': 'SUCCESS', 'Result': params});
                            }
                            return returnSUCCESS(res, "操作成功");
                        }
                    });

                }else{
                    return returnFAIL(res, "退菜数已超出已点菜数量");
                }
            }else{
                return returnFAIL(res, "没有找到所退的菜");
            }
        }
    });
});

/**
 * 点菜
 * {parameters:{
 * "orderId":"54c33a72c5f552f81148c39f",
 * "waiterId": "84654874654",
 * list: '[{"dishesId":"54b3790bc0d00c9c07ec5291","quantity":2},{"dishesId":"54b3790bc0d00c9c07ec5291","quantity":2}]'
 * package: '[{'dishesId': '', list:['54b3790bc0d00c9c07ec5291', '54b3790bc0d00c9c07ec5291']}]'
 * }}
 */
router.post('/addDishesOrder', function (req, res) {
    //判断是否是可解释的json格式
    if(tool.isJson(req.body.parameters)){
       var params = JSON.parse(req.body.parameters);
        //判断必要字段是否传入
       if (params.waiterId && (params.list || params.package) && params.orderId) {
           var arr = [];
           var package = [];
           var orderId = params.orderId;
           var waiterId = params.waiterId;

           if(params.list){
               arr = params.list;
           }

           if(params.package){
               package = params.package;
           }

           async.auto({
                getWaiterName: function(cb){
                    //查询服务员
                    staff.getStaffByQuery({_id: waiterId},{},function(err,waiterData){
                        if(err){
                            cb(err)
                        }else if(waiterData && waiterData.length > 0){
                            cb(null, {waiterName: waiterData[0].userName});
                        }else{
                            cb({message: "参数错误"});
                        }
                    });
                },
                waitWaiterName:['getWaiterName', function (cb, data) {
                    orderCommon.createDishesOrder(arr, package, orderId, data.getWaiterName.waiterName, constant.PATTERN.GROG_SHOP, function (err, content) {
                        cb(err);
                    })
                }]
           }, function (err) {
                if(err){
                    return returnFAIL(res, err.message);
                }else{
                    dishesOrder.getDishesOrderByQuery({orderId: orderId}, {}, function (err, dishesOrderData) {
                        if(err){
                            return returnFAIL(res, err.message);
                        }else{
                            for(var j in SOCKETS.kitchen){
                                SOCKETIO.sockets.socket(SOCKETS.kitchen[j].kitchenSocketId).emit('getDishesOrder',{'ResultCode': 'SUCCESS', 'Result': dishesOrderData});
                            }
                            return returnSUCCESS(res, "下单成功");
                        }
                    });
                }
           });

       }else{
            return returnFAIL(res, "缺少参数");
       }
    }else{
        return returnFAIL(res, "数据格式错误");
    }

});


/**
 * 催菜
 */
router.post('/pushFood', function(req, res){
    var params = deleteNull(validator, req.body);
    if(params._id){
        var query = {_id: params._id};
        var update = {$set: {state: constant.DISHES_STATE.REMINDER}};

        //更新数据库，预防数据丢失
        dishesOrder.updateDishesOrder(query, update, function (err, doc) {
            if(err){
                return returnFAIL(res, err.message);
            }else if(doc){
                for(var i in SOCKETS.waiter){
                    SOCKETIO.sockets.socket(SOCKETS.waiter[i].waiterSocketId).emit('getFoodState',{'ResultCode': 'SUCCESS', 'Result': doc});
                }
                for(var j in SOCKETS.kitchen){
                    SOCKETIO.sockets.socket(SOCKETS.kitchen[j].kitchenSocketId).emit('getFoodState',{'ResultCode': 'SUCCESS', 'Result': doc});
                }
                return returnSUCCESS(res, "操作成功");

            }else{
                return returnFAIL(res, "操作失败");
            }
        });
    }else{
        return returnFAIL(res, "操作失败");
    }

});


/**
 * 划菜
 */
router.post('/draw', function(req, res){
    var params = deleteNull(validator, req.body);
    var query = {}, update = {};
    if(params._id && params.number){
        query._id = params._id;
        update = {$inc: {'number': parseInt(params.number, 10)}};

        dishesOrder.getDishesOrderByQuery(query, {}, function (err, dishesOrderData) {
            if (err) {
                return returnFAIL(res, err.message);
            }else{
                if (dishesOrderData.length > 0) {

                    //点菜数量 >= 划菜数量 + 本次划菜数量 + 退菜数量
                    if (dishesOrderData[0].quantity >= (dishesOrderData[0].number + parseInt(params.number) + dishesOrderData[0].recedeNum)) {

                        if (dishesOrderData[0].quantity == (dishesOrderData[0].number + parseInt(params.number) + dishesOrderData[0].recedeNum)){
                            update.$set = {state: 4};
                        }
                        dishesOrder.updateDishesOrder(query, update, function (err) {
                            if(err){
                                return returnFAIL(res, err.message);
                            }else{
                                for(var i in SOCKETS.waiter){
                                    SOCKETIO.sockets.socket(SOCKETS.waiter[i].waiterSocketId).emit('getDraw',{'ResultCode': 'SUCCESS', 'Result': params});
                                }
                                for(var j in SOCKETS.kitchen){
                                    SOCKETIO.sockets.socket(SOCKETS.kitchen[j].kitchenSocketId).emit('getDraw',{'ResultCode': 'SUCCESS', 'Result': params});
                                }
                                return returnSUCCESS(res, "操作成功");
                            }
                        });
                    }else{
                        return returnFAIL(res, '划菜数量超过点菜数量');

                    }
                }else{
                    return returnFAIL(res, '没找到对应的菜单');
                }
            }
        });

    }else{
        return returnFAIL(res, "信息不完整");
    }
});

module.exports = router;