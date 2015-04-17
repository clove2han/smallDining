/**
 * @module controllers/dishesOrder
 * @description 菜品订单的路由
 * @author 冀玉鑫
 * @modified By
 */
var router = require('express').Router();
var dishesOrder = require(PROXY).dishesOrder;
var restOrders = require(PROXY).restOrders;
var validator = require('validator');
var moment = require('moment');
var syncData=require(BASEDIR+'/tools/syncData');
var tool = require(BASEDIR + '/tools/tool');

/**
 * 根据条件查询菜品订单
 * @param orderId : 订单ID
 * @param id: ID
 * @param dishTypeId: 菜品类型
 * @param state: 状态
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: dishesOrders}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/query' , function (req, res) {
    var params = deleteNull(validator,req.body);
    var query = {};
    if(params._id){
        query._id = params._id;
    }

    if(params.pattern){
        query.pattern = params.pattern
    }

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

    if(params.orderId){
        query.orderId = params.orderId;
    }
    if(params.dishTypeId){
        query.dishTypeId = params.dishTypeId;
    }

    if(params.dishTypeIds){
        query.dishTypeId = {$in: params.dishTypeIds.split(',')};
    }

    if(params.state){
        query.state = params.state;
    }
    if(params.isCookDone === true){
        query.state = {"$in" : [constant.DISHES_STATE.HAVE_DONE, constant.DISHES_STATE.HAVE_SERVING]};
    }
    if(params.states){
        delete query.state;
        var stateArr = params.states.split(',');
        query.state = {"$in" : stateArr};
    }

    if(params.type){
        query.type = parseInt(params.type);
    }

    if(params.waiter){
        query.waiter = params.waiter;
    }
    if(params.waiters){
        query.waiter = {$in: params.waiters.split(',')};
    }

    dishesOrder.getDishesOrderByQuery(query, null, function(error, dishesOrderData){
        if(error){
            return returnFAIL(res, error.message);

        }else{

            dishesOrderData.forEach(function(item){
                if(!tool.isObjectEmpty(item.orderId)){
                    var discount = !tool.isNull(item.orderId.discount) ? tool.toDecimal1Two(item.orderId.discount) : 1;
                    item.price = tool.toDecimal1(item.price * discount);
                }
            });
            return returnSUCCESS(res, dishesOrderData);
        }
    });
});

/**
 * 根据条件查询菜品订单数量
 * @param dishesId : 订单号
 * @param id: ID
 * @param orderId: 订单ＩＤ
 * @param dishTypeId: 菜品类型
 * @param state: 状态
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: count}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/count' , function (req, res) {
    var params = req.body;
    var query = {};
    if(params._id){
        query["_id"] = params._id;
    }
    if(params.orderId){
        query["orderId"] = params.orderId;
    }
    if(params.dishTypeId){
        query["dishTypeId"] = params.dishTypeId;
    }
    if(params.state){
        query["state"] = params.state;
    }
    if(params.states){
        var stateArr = params.states.split(',');
        query["state"] = {"$in" : stateArr};
    }
    dishesOrder.getDishesOrderCount(query, function(error, count){
        if(error){  //如果有错误，则输出错误信息
            return returnFAIL(res, error.message);

        }else{ //否则返回菜品订单数量
            return returnSUCCESS(res, count);
        }
    });
});

/**
 * 修改菜品订单
 * @param id : 订单的ID
 * @params orderId : 订单ID
 * @param dishTypeId :  菜品类型ID
 * @param quantity : 已点菜品数量
 * @param price : 单价
 * @param state : 状态( 0:待做  1:正在做菜  2:催菜 3:已做完， 4:已上菜)
 * @param number : 划菜的数量
 * @param flavor : 口味
 * @param remark : 备注
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: "更新菜品订单成功"}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/update' , function (req, res) {
    var params = req.body;

    if(params._id){
        //更新菜品订单的查询条件
        var query = {
            _id : params._id
        };
        delete params['_id'];

        if(isEmptyObject(params)){
            return returnFAIL(res, "没有要修改的内容");

        }else{
            var orderId = params.orderId;
            delete params['orderId'];

            if(params.quantity) params.quantity = parseInt(params.quantity, 10);
            if(params.price) params.price = parseFloat(params.price);
            if(params.state) params.state = parseInt(params.state, 10);
            if(params.number) params.number = parseInt(params.number, 10);

            dishesOrder.updateDishesOrder(query, params, function(error, doc){
                if(error){ //如果有错误，则输出错误信息
                    return returnFAIL(res, error.message);

                }else{ //否则返回修改成功
                    //计算总价
                    calculateTotalPrice(orderId, function(error, totalPrice){
                        if(error){
                            return returnFAIL(res, error.message);

                        }else{
                            restOrders.updateTotalPrice(orderId, totalPrice);    //修改总价

                        }
                        //将订单的主键_id(就是菜品订单的orderId)传入同步订单的方法
                        syncData.syncRestOrders(params.orderId);
                        return returnSUCCESS(res, "修改菜品订单成功");
                    });
                }
            });
        }
    }else{
        return returnFAIL(res, "请选择要修改的菜品订单");
    }
});

module.exports = router;