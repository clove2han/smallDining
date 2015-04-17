/**
 * 2015/1/19
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var validator = require('validator');
var moment = require('moment');
var dishesOrder = require(PROXY).dishesOrder;
var saveSocket = require(CONTROLLERS + '/common/saveSocket');
var tool = require(BASEDIR + '/app/common/utils/tool');

/**
 * 保存厨师端的socketId
 * @param string socketId
 * @param string kitchenName
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
 * 厨师端 - 获得所有 已点/已完成 菜品
 * @params dishTypeIds string 厨师对应的分类
 */
router.post('/getAllDishesOrder', function (req, res) {
    var params = deleteNull(validator,req.body);
    //查询条件为模式为酒楼快餐模式，状态是完成之前的所有状态
    var query = {'pattern': constant.PATTERN.GROG_SHOP_AND_SNACK, 'isPackage': false, isNeedCook: true};

    var queryTime = {};
    if(params.startTime){
        queryTime.$gte = moment(params.startTime).format('YYYY-MM-DD')+ " 00:00:00";
    }
    if(params.endTime){
        queryTime.$lte = moment(params.endTime).format('YYYY-MM-DD')+ " 23:59:59";
    }

    if(!tool.isObjectEmpty(queryTime)){
        query.createTime = queryTime;
    }

    if(params.isCookDone == "true"){
        query.state = {"$in" : [constant.DISHES_STATE.HAVE_DONE, constant.DISHES_STATE.HAVE_SERVING]};
    }else{
        query.state = {"$in" : [constant.DISHES_STATE.TODO, constant.DISHES_STATE.COOKING, constant.DISHES_STATE.REMINDER]};
    }

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
 * 完成一道菜
 * @param string _id 菜品订单_id
 * @param int number 完成的数量
 */
router.post('/dishesOk', function (req, res) {
    var query = {}, update = {};
    var params = deleteNull(validator, req.body);

    if(params._id && params.number){
        query._id = params._id;
        query.state = {$lt: constant.DISHES_STATE.HAVE_DONE};
        dishesOrder.getDishesOrder(query, function (err, dishesOrderData) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                if(dishesOrderData.length > 0){
                    //判断点的总数量 = 之前做的数量+现在做的数量+退的数量
                    var number = parseInt(params.number);

                    if(dishesOrderData[0].quantity >= (dishesOrderData[0].number + dishesOrderData[0].recedeNum + number)){
                        update.$inc = {number: number};

                        if(dishesOrderData[0].quantity == (dishesOrderData[0].number + dishesOrderData[0].recedeNum + number)) {
                            update.$set = {state: constant.DISHES_STATE.HAVE_DONE};
                        }

                        dishesOrder.updateDishesOrder(query, update, function (err, result) {
                            if(err){
                                return returnFAIL(res, err.message);
                            }else{
                                dishesOrder.getDishesOrderByQuery({_id: result},function(error, result){

                                    //做完一道菜，通知所有的上菜端
                                    for(var i in SOCKETS.goFood){
                                        SOCKETIO.sockets.socket(SOCKETS.goFood[i].goFoodSocketId).emit('gAnds_dishesOk',{'ResultCode': 'SUCCESS', 'Result': result});
                                    }

                                    //考虑到可能有其他的厨师端，通知状态同步
                                    for(var j in SOCKETS.kitchen){
                                        SOCKETIO.sockets.socket(SOCKETS.kitchen[j].kitchenSocketId).emit('gAnds_dishesOk',{'ResultCode': 'SUCCESS', 'Result': result});
                                    }
                                    return returnSUCCESS(res, "操作成功");
                                });
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
});

module.exports = router;