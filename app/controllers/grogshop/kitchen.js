/**
 * 2015/1/19
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var validator = require('validator');
var dishesOrder = require(PROXY).dishesOrder;
var saveSocket = require(CONTROLLERS + '/common/saveSocket');

/**
 * 保存厨师端的socketId
 */
router.post('/saveSocketId', function (req, res) {
    saveSocket.saveKitchen(req.body, function (err) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, "保存成功");
        }
    });
});


/**
 * 获得所有已点菜
 * @params dishTypeIds string 厨师对应的分类
 */
router.post('/getAllDishesOrder', function (req, res) {
    //查询条件为模式为酒楼模式，状态是完成之前的所有状态
    var query = {'pattern': constant.PATTERN.GROG_SHOP, 'state': {'$in' : [constant.DISHES_STATE.TODO, constant.DISHES_STATE.COOKING, constant.DISHES_STATE.REMINDER]}, 'isPackage': false};

    if(req.body.dishTypeIds){
        query.dishTypeId = {$in: req.body.dishTypeIds.split(',')};
    }

    dishesOrder.getDishesOrderByQuery(query, null, function(error, dishesOrderData){
        if(error){
            return returnFAIL(res, error.message);

        }else{
            return returnSUCCESS(res, dishesOrderData);
        }
    });
});


/**
 * 做菜中的状态
 */
router.post('/cooking', function(req, res){
    var query = {}, update = {};

    if(req.body._id){
        query._id = req.body._id;
        update = {$set: {state: 1}};

        dishesOrder.getDishesOrderByQuery(query, {}, function (err, doc) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                if(doc.length > 0){
                    if(doc[0].quantity >= (doc[0].recedeNum + doc[0].finishNumber)){
                        dishesOrder.updateDishesOrder(query, update, function (err) {
                            if(err){
                                return returnFAIL(res, err.message);

                            }else{
                                //正常做菜，通知所有的服务员端
                                for(var i in SOCKETS.waiter){
                                    SOCKETIO.sockets.socket(SOCKETS.waiter[i].waiterSocketId).emit('getFoodState',{'ResultCode': 'SUCCESS', 'Result': {_id: query._id, state:1}});
                                }
                                for(var j in SOCKETS.kitchen){
                                    SOCKETIO.sockets.socket(SOCKETS.kitchen[j].kitchenSocketId).emit('getFoodState',{'ResultCode': 'SUCCESS', 'Result': {_id: query._id, state:1}});
                                }
                                return returnSUCCESS(res, "操作成功");
                            }
                        });
                    }else{
                        return returnFAIL(res, "操作失败");
                    }

                }else{
                    return returnFAIL(res, "操作失败");
                }
            }
        });

    }else{
        return returnFAIL(res, "操作失败");
    }
});

/**
 * 完成一道菜
 */
router.post('/dishesOk', function (req, res) {
    var query = {}, update = {};
    var params = deleteNull(validator, req.body);

    if(params._id && params.number){
        query._id = params._id;
        query.state = {$lt: 3};

        dishesOrder.getDishesOrder(query, function (err, dishesOrderData) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                if(dishesOrderData.length > 0){
                    //判断点的总数量 = 之前做的数量+现在做的数量+退的数量
                    var finishNumber = parseInt(params.number);

                    if(dishesOrderData[0].quantity >= (dishesOrderData[0].finishNumber + dishesOrderData[0].recedeNum + finishNumber)){
                        update.$inc = {finishNumber: finishNumber};
                        update.$set = {state: constant.DISHES_STATE.TODO};

                        if(dishesOrderData[0].quantity == (dishesOrderData[0].finishNumber + dishesOrderData[0].recedeNum + finishNumber)) {
                            update.$set = {state: constant.DISHES_STATE.HAVE_DONE};
                        }

                        dishesOrder.updateDishesOrder(query, update, function (err, result) {
                            if(err){
                                return returnFAIL(res, err.message);
                            }else{
                                //做完一道菜，通知所有的服务员端
                                for(var i in SOCKETS.waiter){
                                    SOCKETIO.sockets.socket(SOCKETS.waiter[i].waiterSocketId).emit('getFoodState',
                                        {'ResultCode': 'SUCCESS', 'Result': {_id: result._id,finishNumber: result.finishNumber, goUpNum: result.goUpNum, recedeNum: result.recedeNum, number: result.number}});
                                }
                                for(var j in SOCKETS.kitchen){
                                    SOCKETIO.sockets.socket(SOCKETS.kitchen[j].kitchenSocketId).emit('getFoodState',{'ResultCode': 'SUCCESS', 'Result': {_id: result._id}});
                                }
                                return returnSUCCESS(res, "操作成功");
                            }
                        });
                    }else{
                        return returnFAIL(res, "操作失败");
                    }
                }else{
                    return returnFAIL(res, "菜品订单不存在");
                }
            }
        });
    }else{
        return returnFAIL(res, "缺少参数");
    }

    /*if(params._id && params.number){
        params.state = 3;
        query._id = params._id;
        update = {$set: {state: params.state}};
        dishesOrder.updateDishesOrder(query, update, function (err) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                //做完一道菜，通知所有的服务员端
                for(var i in SOCKETS.waiter){
                    SOCKETIO.sockets.socket(SOCKETS.waiter[i].waiterSocketId).emit('getFoodState',{'ResultCode': 'SUCCESS', 'Result': params});
                }
                for(var j in SOCKETS.kitchen){
                    SOCKETIO.sockets.socket(SOCKETS.kitchen[j].kitchenSocketId).emit('getFoodState',{'ResultCode': 'SUCCESS', 'Result': params});
                }
                return returnSUCCESS(res, "操作成功");
            }
        })
    }else{
        return returnFAIL(res, "操作失败");
    }*/
});

module.exports = router;