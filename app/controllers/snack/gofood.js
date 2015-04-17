/**
 * 2015/1/28
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var validator = require('validator');
var tool = require(BASEDIR + '/app/common/utils/tool');
var dishes = require(PROXY).dishes;
var async = require('async');
var dishesOrder = require(PROXY).dishesOrder;
var saveSocket = require(CONTROLLERS + '/common/saveSocket');
var goFoodCommon = require(CONTROLLERS + '/common/goFoodCommon');
var tran = require(BASEDIR + '/app/common/utils/transDelegated');


/**
 * 保存上菜端的socketId
 * @param string socketId
 */
router.post('/saveSocketId', function (req, res) {
    saveSocket.saveGoFood(req.body, function (err) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, "保存成功");
        }
    });
});

/**
 * 点击上菜按钮
 * @param string _id 菜品订单的_id
 * @param int number 上菜的数量
 */
router.post('/goUpDishes', function (req, res) {
    var data = tool.deleteNull(validator, req.body);

    if (data._id && data.number) {
        var number = parseInt(data.number);
        var dishesOrderId = String(data._id);

        async.auto({
            getDishesOrderInfo: function (cb) {
                //检查菜单是否可操作是否存在
                var query = {_id: dishesOrderId, state:{$nin: [4,5]}};
                dishesOrder.getDishesOrder(query, function (err, result) {
                    if(err){
                        cb(err);
                    }else{
                        if(result.length >0){
                            cb(err, result[0]);
                        }else{
                            cb({message: "操作失败"});
                        }
                    }
                });
            },
            getDishesInfo: ['getDishesOrderInfo', function (cb, data) {
                //获得菜品是否存在，用于事务记录需求与库存
                var dishesOrderData = data.getDishesOrderInfo;
                    var dishesId = dishesOrderData.dishesId;
                    //查询该菜是否存在
                    dishes.getDishesById(dishesId, function (err, dishesData) {
                        if(err){
                            cb(err)
                        }else{
                            if(tool.isObjectEmpty(dishesData)){
                                cb({message: "菜品不存在"})
                            }else{
                                cb(err, dishesData);
                            }
                        }
                    });
            }],
            startTarn:['getDishesInfo', function (cb, data) {
                var dishesOrderInfo = data.getDishesOrderInfo;
                var dishesInfo = data.getDishesInfo;

                var dishesOrderQuery = {};
                var dishesOrderUpdate = {};
                var dishesQuery = {};
                var dishesUpdate = {};

                dishesOrderQuery._id = dishesOrderId;

                //判断库存 库存 >= 上的数量
                if((dishesInfo.surplus >= number) && (dishesInfo.haveOnNumber >= number)){
                    //点的数量 = 之前上的数量+现在上的数量+退的数量
                    if(dishesOrderInfo.quantity >= (dishesOrderInfo.goUpNum + number + dishesOrderInfo.recedeNum)){
                        dishesOrderUpdate.$inc = {goUpNum: number};
                        if(dishesOrderInfo.quantity == (dishesOrderInfo.goUpNum + number + dishesOrderInfo.recedeNum)){
                            dishesOrderUpdate.$set = {state: 4};
                        }
                    }else{
                        cb({message: "操作失败"})
                    }

                    dishesQuery._id = dishesInfo._id;
                    dishesUpdate = {$inc: {surplus: -number, haveOnNumber: -number}};

                    var array = [
                        {
                            collection: "dishesOrder",
                            query: dishesOrderQuery,
                            update: dishesOrderUpdate
                        },
                        {
                            collection: "dishes",
                            query: dishesQuery,
                            update: dishesUpdate
                        }
                    ];

                    tran(array, function(err){
                        cb(err)
                    });
                }else{
                    cb({message: '库存不足或超出需求量'});
                }

            }]
        }, function (err) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                dishesOrder.getSnackDishesOrder({_id: dishesOrderId}, function (err, dishesData) {
                    if(!err){
                        for(var i in SOCKETS.goFood){
                            SOCKETIO.sockets.socket(SOCKETS.goFood[i].goFoodSocketId).emit('changeDishesState',{'ResultCode': 'SUCCESS', 'Result': dishesData[0]});
                        }
                        for(var g in SOCKETS.prepare){
                            SOCKETIO.sockets.socket(SOCKETS.prepare[g].prepareSocketId).emit('changeDishesState',{'ResultCode': 'SUCCESS', 'Result': dishesData[0]});
                        }
                        for(var j in SOCKETS.cashier){
                            SOCKETIO.sockets.socket(SOCKETS.cashier[j].cashierSocketId).emit('changeDishesState',{'ResultCode': 'SUCCESS', 'Result': dishesData[0]});
                        }

                        return returnSUCCESS(res, "操作成功");
                    }
                });

            }
        });

    }else{
        return returnFAIL(res, "缺少参数");
    }
});

/**
 * 上菜端完成按钮
 */
router.post('/goUpDishesOk', function (req, res) {
    var orderId = req.body.orderId;

    goFoodCommon.goUpDishesOk(orderId, function (err) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, '操作成功');
        }
    });
});


module.exports = router;