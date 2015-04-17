/**
 * 2014/12/5
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var config = require(BASEDIR + '/app/config/config.json');
var validator = require('validator');
var request = require('request');
var tool = require(BASEDIR + '/app/common/utils/tool');
var restOrders = require(PROXY).restOrders;
var payCommon = require(CONTROLLERS + '/common/payCommon');

/*
 * 手动添加外卖订单接口
 * @param
 */
router.post('/addTakeout', function (req, res) {
    var data = deleteNull(validator, req.body);
    var package = [];

    if(!data.totalPrice || !data.cashierName || !data.cashierId || !data.deliveryAddress || !data.phone || !data.linkman || !data.goods || !data.pattern){
        return returnFAIL(res, "缺少参数");
    }else{
        if(!tool.isJson(data.goods)){
            return returnFAIL(res, '参数错误')
        }

        //如果有套餐,并验证套餐里的内容是否合法
        if(data.package){
            if(tool.isJson(data.package)){
                package = JSON.parse(data.package);

                //暂时认为都为合法

            }else{
                return returnFAIL(res, "参数错误");
            }
        }


        //进行外卖订单的储存
        var takeoutOrder = {
            orderNumber: tool.createOrderNumber()
            ,orderType: 2
            ,pattern: data.pattern
            ,totalPrice: data.totalPrice
            ,orderState: data.payState == 1 ? 0: 1
            ,isPack:true
            ,cashier:{name: data.cashierName, cashierId: data.cashierId}
            ,deliverInfo:{
                deliverTime: data.deliveryTime || new Date()
                ,deliverAddr: data.deliveryAddress
                ,telephone: data.phone
                ,linkman: data.linkman
                ,isPayOnDelivery: true
                ,orderTime: new Date()
                ,state: 2
            }
            ,ongoing: false
        };

        restOrders.addRestOrders(takeoutOrder, function (err, restOrdersData) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                //所点的菜
                var arr = JSON.parse(data.goods);
                payCommon.createDishesOrder(arr, package, String(restOrdersData._id), data.cashierName, {}, data.pattern, function (err) {
                    if(err){

                        restOrders.removeDishesOrder({_id: restOrdersData._id}, function (err) {
                        });
                        return returnFAIL(res, err.message);
                    }else{
                        for(var i in SOCKETS.cashier){
                            SOCKETIO.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('getTakeoutOrder',"newOrder");
                        }
                        return returnSUCCESS(res, {orderId: restOrdersData._id});
                    }
                });
            }
        });
    }
});

/*
 * 确认订单
 * @ param _id {string}
 * @ param cashier {string}
 * */
/*router.post('/confirmOrder', function (req, res) {

    var query = {}, update = {};
    var params = deleteNull(validator, req.body);
    if(!params._id){
        return returnFAIL(res, "没有修改对象");
    }

    console.log('++++++++++++++++++++++++');
    console.log(params);
    console.log('++++++++++++++++++++++++');

    query._id = params._id;
    update = {$set: {"deliverInfo.state": 2, cashier: {cashierId: params.cashier.cashierId, name: params.cashier.name}, ongoing: true}};

    request.post({url: config.smallWallet + '/server/order/takeOutOrder/affirmOrder', form: query}, function (err, httpResponse, body) {
        //
        if(err){
            console.log(err);
            return returnFAIL(res, "连接小猫服务器异常");
        }else{

            if(JSON.parse(body).ResultCode == 'SUCCESS'){
                query["deliverInfo.state"] = 1;
                restOrders.updateRestOrders(query, update, function (err, restOrderData) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }else{
                        for(var i in SOCKETS.cashier){
                            SOCKETIO.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('confirmOrder',"newOrder");
                        }
                        return returnSUCCESS(res, "成功");
                    }
                })
            }else{
                return returnFAIL(res, "失败");
            }
        }

    });
});*/


/*
 * 外卖送出
 */
/*router.post('/sendingTakeOut', function (req, res) {
    //data {_id}
    var query = {}, update = {};
    var params = deleteNull(validator, req.body);

    if(!params._id){
        return returnFAIL(res, "没有修改对象");
    }

    query._id = params._id;
    update.$set = {"deliverInfo.state": 4, ongoing: false};

    request.post({url: config.smallWallet + '/server/order/takeOutOrder/sendOutOrder', form: query}, function (err, httpResponse, body) {
        //
        if(err){
            return returnFAIL(res, "连接小猫服务器异常");

        }else{
            if(JSON.parse(body).ResultCode == 'SUCCESS'){
                restOrders.updateRestOrders(query, update, function (err, restOrderData) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }else{
                        for(var i in SOCKETS.cashier){
                            SOCKETIO.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('sendingTakeOut',"newOrder");
                        }
                        return returnSUCCESS(res, "成功");
                    }
                })
            }else{
                return returnFAIL(res, "失败");
            }
        }
    });

})*/

/*
 * 完成外卖流程
 */
/*
router.post('/finishOrder', function (req, res) {

        //data {_id}
    var query = {}, update = {};
    var params = deleteNull(validator, req.body);

    if(!params._id){
        return returnFAIL(res, "没有修改对象");
    }

    query._id = params._id;
    update.$set = {"deliverInfo.state": 7, "orderState": 1};

    request.post({url: config.smallWallet + '/server/order/takeOutOrder/finishOrder', form: query}, function (err, httpResponse, body) {
        //
        if(err){
            return returnFAIL(res, "连接小猫服务器异常");

        }else{
            if(JSON.parse(body).ResultCode == 'SUCCESS'){
                restOrders.updateRestOrders(query, update, function (err, restOrderData) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }else{

                        for(var i in SOCKETS.cashier){
                            SOCKETIO.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('finishOrder',"newOrder");
                        }
                        return returnSUCCESS(res, "成功");
                    }
                })
            }else{
                return returnFAIL(res, "失败");
            }
    }
    });

});
*/

module.exports = router;