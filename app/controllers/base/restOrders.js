/**
 * @module controllers/restOrders
 * @description 餐厅订单的路由
 * @author 冀玉鑫
 * @modified By 黄耀奎
 */
var router = require('express').Router();
var restOrders = require(PROXY).restOrders;
var dishesOrder = require(PROXY).dishesOrder;
var diningMember =require(PROXY).diningMember;
var dishes = require(PROXY).dishes;
var table = require(PROXY).table;
var tool = require(BASEDIR + '/tools/tool');
var async = require('async');
var moment = require('moment');
var validator = require('validator');

/**
 * 根据条件查询订单
 * @param id : 订单ID
 * @param orderNumber : 订单号
 * @param orderState : 订单状态 (0:待结账 1：已结账）
 * @param orderType : 订单类型 (1:餐厅 2:外卖 3:团购)
 * @param  foundingInfo.diningTableId: 台位ID
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: dishesTypes}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/query', function (req, res) {
    var params = deleteNull(validator, req.body);
    var opt = {},data = [];
    //定义查询条件
    var query = {};
    if (params._id) {
        query['_id'] = params._id;
    }
    if (params.orderState) {
        query['orderState'] = params.orderState;
    }
    if (params.orderType) {
        query['orderType'] = params.orderType;
    }
    if(params.pattern){
        query['pattern'] = params.pattern;
    }
    if (params.orderNumber) {
        query['orderNumber'] = params.orderNumber;
    }
    if (params.foundingInfo && params.foundingInfo.diningTableId) {
        query['foundingInfo.diningTableId'] = params.foundingInfo.diningTableId;
    }
    //台位号
    if (params.diningTableName) {
        query['foundingInfo.diningTableName'] = params.diningTableName;
    }
    //会员号
    if(params.phone){
        query['deliverInfo.telephone'] = params.phone;
    }
    if(params.cashierId){
        query["cashier.cashierId"] = params.cashierId;
    }

    if(params.ongoing == 'true'){
        query['ongoing'] = true;
    }

    if(params.isDone == 'true'){
        query['isDone'] = true;
    }else if(params.isDone == 'false'){
        query['isDone'] = false;
    }

    if(params.isNow == 'true'){
        var queryTime = {};

        queryTime.$gte = moment().format('YYYY-MM-DD')+ " 00:00:00";
        queryTime.$lte = moment().format('YYYY-MM-DD')+ " 23:59:59";

        if(!tool.isObjectEmpty(queryTime)){
            query.createDate = queryTime;
        }
    }

    //query['backState'] = 0;

    async.waterfall(
        [
            function (callback) {
                if(params.membNo){
                    var memberQuery = {
                        membNo: params.membNo
                        ,isDel: false
                    };
                    diningMember.getMemberByQuery(memberQuery, null, function(error, docs){
                        if(error){
                            callback(error);

                        }else if(docs && docs.length > 0){
                            query.diningMemberId = docs[0]._id;
                            callback(null);

                        }else{
                            //没有指定会员，无法查出结果
                            query.diningMemberId = "-1";
                            callback(null);
                        }
                    });
                }else{
                    callback(null);
                }

            },
            function (callback) {
                //查询分页条件
                if(params.pageNumber){
                    var pageNumber = parseInt(params.pageNumber); //当前页
                    restOrders.getRestOrdersCount(query, function (err, count) {
                        if(err){
                            callback(err);
                        }else{
                            var showNumber = 24;   //每页显示的页数
                            var totalPage = Math.floor((count-1) / showNumber + 1) ;  //总页数
                            totalPage = totalPage >= 0 ? totalPage: 0;
                            data.push({totalPage: totalPage});
                            pageNumber = pageNumber <= 1? 0 : (pageNumber > totalPage? totalPage: pageNumber); //当前页的判断
                            opt.skip = pageNumber * showNumber;
                            opt.limit = showNumber;
                            callback(null);
                        }

                    });

                }else{
                    callback(null);
                }
            },
            function (callback) {
                restOrders.getRestOrdersByQuery(query, opt, function (err, docs) {
                    if(err){
                        callback(err);
                    }else if(docs){
                        if(docs.length > 0){
                            docs.forEach(function (item) {
                                data.push(item);
                            });

                        }
                        callback(null, data);
                    }
                });
            }
        ], function (err, result) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                return returnSUCCESS(res, result);
            }
         }
    );
});

/**
 * 免单
 * 将折扣改为0，折扣价改为订单总额，标识为免单订单
 */
router.post('/freeOrder', function(req, res){
    var params = req.body;
    if(!params._id){
        return returnFAIL(res, "订单号不能为空。");
    }

    restOrders.getRestOrdersById(params._id, null, function(error, doc){
        if(error){
            return returnFAIL(res, error.message);

        }else if(doc){
            if(doc.isFree){
                return returnFAIL(res, "该订单已经免单，不能重复操作。");

            }else{
                var query = {
                    _id : params._id
                };
                var update = {
                    isFree : true
                    ,discount: 0
                    ,discountPrice: doc.totalPrice
                };
                //将折扣改为0，折扣价改为订单总额，标识为免单订单
                restOrders.updateRestOrders(query, update, function(err, obj){
                    if(err){
                        return returnFAIL(res, error.message);

                    }else{
                        return returnFAIL(res, "免单成功");
                    }
                });
            }
        }else{
            return returnFAIL(res, "没有找到指定订单");
        }
    });
});


/*
 * 快餐模式订单查询
 * @param condition
 * @return json
 * */
router.post('/queryOrder', function (req, res) {
    var query = {};
    var params = deleteNull(validator, req.body);
    //根据时间查询
    if(params.orderNumber){
        query.orderNumber = params.orderNumber;
    }
    if(params._id){
        query._id = params._id;
    }
    restOrders.getOneOrder(query, function (err, docs) {
        if(err){
            return returnFAIL(res, err.message);
        }
        dishesOrder.getDishesOrder({orderId: docs._id}, function (err, result) {
            if(err){
                return returnFAIL(res, err.message);
            }
            return returnSUCCESS(res, result);

        });
    });
});

/**
 * 快餐模式
 */
router.post('/sendOrderInfo', function (req, res) {
    var query = {};
    var params = tool.deleteNull(validator, req.body);
    if (params.orderId) {
        query.orderId = params.orderId;
        restOrders.updateRestOrders({_id: query.orderId}, {$set: {ongoing: true}}, function (err, restOrderData) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                dishesOrder.getSnackDishesOrder(query, function (err, list) {
                    if (err) {
                        return returnFAIL(res, err.message);
                    }
                    if(list.length > 0){
                        async.each(list, function(item, callback) {
                            dishes.updateDishes({_id: item.dishesId._id}, {$inc: {salesVolume: item.quantity, haveOnNumber: item.quantity}}, function (err) {
                                callback(err);
                            });
                        }, function(err) {
                            if(err){
                                return returnFAIL(res, err.message);
                            }else{
                                SOCKETIO.sockets.emit('getOrderInfo', list);
                                SOCKETIO.sockets.emit('newNeed', {"Result": "添加了需求"});
                                return returnSUCCESS(res, "成功");
                            }
                        });
                    }

                });
            }
        });
    }else{
        return returnFAIL(res, "缺少参数");
    }

});


/**
 * 修改订单
 * @param id : 订单ID
 * @param * : 订单基本信息
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: "修改订单成功"}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/update', function (req, res) {
    var params = req.body;

    if (params._id) {
        //更新菜品类型的查询条件
        var query = {
            _id: params._id
        };
        delete params['id'];

        if (isEmptyObject(params)) {
            return returnFAIL(res, "没有要修改的内容");

        } else {
            restOrders.updateRestOrders(query, params, function (error) {
                if (error) { //如果有错误，则输出错误信息
                    return returnFAIL(res, error.message);

                } else { //否则返回修改成功
                    return returnSUCCESS(res, "修改订单成功");
                }
            });
        }
    } else {
        return returnFAIL(res, "请选择要修改的订单");
    }
});

module.exports = router;

