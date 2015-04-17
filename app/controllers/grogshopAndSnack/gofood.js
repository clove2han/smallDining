/**
 * 2015/1/24
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var saveSocket = require(CONTROLLERS + '/common/saveSocket');
var goFoodCommon = require(CONTROLLERS + '/common/goFoodCommon');
var dishesOrder = require(PROXY).dishesOrder;
var restOrders = require(PROXY).restOrders;
var validator = require('validator');
var tool = require(BASEDIR + '/tools/tool');

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
 * 点击上菜时触发
 * @param string _id 对应菜单详情的_id
 * @param string number 上菜的数量
 */
router.post('/goUpFood', function (req, res) {
    var params = tool.deleteNull(validator, req.body);
    var query = {}, update = {};
    if(params._id && params.number){

        var number = parseInt(params.number);
        query._id = params._id;
        update = {$inc:{'goUpNum': number}};

        dishesOrder.getDishesOrderByQuery(query, {}, function (err, dishesOrderData) {
            if (err) {
                return returnFAIL(res, err.message);
            }else{
                if (dishesOrderData.length > 0) {
                    //总数量 = 之前上菜的数量+现在要上的数量+退的数量
                    if (dishesOrderData[0].quantity >= (dishesOrderData[0].goUpNum + number + dishesOrderData[0].recedeNum)) {
                        if (dishesOrderData[0].quantity == (dishesOrderData[0].goUpNum + number + dishesOrderData[0].recedeNum)){
                            update.$set = {'state': constant.DISHES_STATE.HAVE_SERVING};
                        }
                        dishesOrder.updateDishesOrder(query, update, function (err, dishesOrderData) {
                            if(err){
                                return returnFAIL(res, err.message);
                            }else{
                                //通知所有的上菜端
                                for(var i in SOCKETS.goFood){
                                    SOCKETIO.sockets.socket(SOCKETS.goFood[i].goFoodSocketId).emit('gAnds_goUpFoodOk',{'ResultCode': 'SUCCESS', 'Result': dishesOrderData});
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

/**
 * 获得所有已点菜
 * @params dishTypeIds string 厨师对应的分类
 */
router.post('/getAllDishesOrder', function (req, res) {
    //查询条件为模式为酒楼快餐模式，状态是完成之前的所有状态
    var query = {'pattern': constant.PATTERN.GROG_SHOP_AND_SNACK, 'state': {'$in' : [constant.DISHES_STATE.TODO,constant.DISHES_STATE.COOKING,constant.DISHES_STATE.REMINDER,constant.DISHES_STATE.HAVE_DONE]}, 'isPackage': false};

    if(req.body.dishTypeIds){
        query.dishTypeId = {$in: req.body.dishTypeIds.split(',')};
    }
    if(req.body.waiters){
        query.waiters = {$in: req.body.waiters.split(',')};
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