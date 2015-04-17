/**
 * 2015/2/2
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var validator = require('validator');
var tool = require(BASEDIR + '/tools/tool');
var syncData = require(BASEDIR + '/tools/syncData');
var takeoutCommon = require(CONTROLLERS + '/common/takeoutCommon');
var restOrders = require(PROXY).restOrders;

/**
 * 查询当天所有没有确认的订单
 */
router.get('/getUnconfirmed', function (req, res) {

    var query = {orderType: constant.ORDER_TYPE.TAKEOUT, 'deliverInfo.state':1};
    query.createDate = {$gte: moment(new Date(), "YYYY-MM-DD").local()._d};

    restOrders.getRestOrdersByQueryNoOpt(query, {}, function (err, result) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, result);
        }
    })
});

/**
 * 查询当天已经确认过的订单
 */
router.get('/getConfirmed', function (req, res) {
    var query = {orderType: constant.ORDER_TYPE.TAKEOUT, 'deliverInfo.state':2, pattern: constant.PATTERN.GROG_SHOP_AND_SNACK};
    query.createDate = {$gte: moment(new Date(), "YYYY-MM-DD").local()._d};

    restOrders.getRestOrdersByQuery(query, {}, function (err, result) {
        if(err){
            return returnFAIL(res, err.message);
        }else{

            return returnSUCCESS(res, result);
        }
    });
});

/**
 * 确认外卖订单
 * @param string _id 订单唯一_id
 * @param cashierId 确认订单的收银员
 */
router.post('/confirm', function (req, res) {


    if(req.body.orderId && req.body.cashierId){
        var orderId = req.body.orderId.trim();
        var cashierId = req.body.cashierId.trim();

        //确认订单时把模式改为2.酒楼快餐模式
        takeoutCommon.confirm(orderId, cashierId, constant.PATTERN.GROG_SHOP_AND_SNACK, function (err) {
            if(err){
                console.log(err);
                //保存数据与小猫服务器一致
                syncData.syncRestOrders(orderId);
                return returnFAIL(res, err.message);
            }else{
                for(var i in SOCKETS.cashier){
                    SOCKETIO.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('confirmOrder',{orderId: orderId});
                }
                return returnSUCCESS(res, "确认成功");
            }
        })
    }else{
        return returnFAIL(res, "缺少参数");
    }
});

/**
 * 送出外卖订单
 * @param string orderId 订单唯一_id
 */
router.post('/sendOut', function (req, res) {
    if(req.body.orderId){
        var orderId = req.body.orderId.trim();

        takeoutCommon.sendOut(orderId, function (err) {
            if(err){
                //保存数据与小猫服务器一致
                syncData.syncRestOrders(orderId);
                return returnFAIL(res, err.message);
            }else{
                for(var i in SOCKETS.cashier){
                    SOCKETIO.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('sendingTakeOut',{orderId: orderId});
                }
                return returnSUCCESS(res, "成功");
            }
        })
    }else{
        return returnFAIL(res, "缺少参数");
    }
});

/**
 * 完成外卖订单
 * @param string orderId 订单唯一_id
 */
router.post('/finish', function (req, res) {

    if(req.body.orderId){
        var orderId = req.body.orderId.trim();

        takeoutCommon.finish(orderId, function (err) {
            if(err){
                //保存数据与小猫服务器一致
                syncData.syncRestOrders(orderId);
                return returnFAIL(res, err.message);
            }else{

                for(var i in SOCKETS.cashier){
                    SOCKETIO.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('finishOrder',{orderId: orderId});
                }
                return returnSUCCESS(res, "确认成功");
            }
        })
    }else{
        return returnFAIL(res, "缺少参数");
    }
});


/**
 * 线上申请退单处理
 */
router.post('/onLineChangeBack', function (req, res) {
    var data = tool.deleteNull(validator, req.body);
    var obj = {};
    if(data.orderId && data.isAgree){
        //如果同意退单
        obj.orderId = data.orderId;

        if(data.isAgree == 'true'){
            obj.state = constant.TAKEOUT_STATE.CONFIRMS;
        }else{
            //拒绝退单
            if(data.repulseInfo){
                obj.state = constant.TAKEOUT_STATE.REMINDER;
                obj.repulseInfo = data.repulseInfo;
            }else{
                return returnFAIL(res, '缺少参数');
            }
        }

        takeoutCommon.onLineChangeBack(obj, function (err) {
            if(err){
                //保存数据与小猫服务器一致
                syncData.syncRestOrders(data.orderId);
                return returnFAIL(res, err.message);
            }else{
                for(var i in SOCKETS.cashier){
                    SOCKETIO.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('feedbackOrder',{orderId: data.orderId});
                }
                return returnSUCCESS(res, "反馈成功");
            }
        })
    }else{
        return returnFAIL(res, '参数错误');
    }
});

/**
 * 线下退单
 * @param orderId string 订单号
 * @param repulseInfo string 退单说明
 * @param source string 退单来源
 */
router.post('/offlineChangeBack', function (req, res) {
    var data = tool.deleteNull(validator, req.body);

    if(data.orderId && data.repulseInfo && data.source){
        var obj = {
            orderId: data.orderId,
            repulseInfo: data.repulseInfo,
            source: data.source
        };

        takeoutCommon.offlineChangeBack(obj, function (err) {
            if(err){
                //保存数据与小猫服务器一致
                syncData.syncRestOrders(data.orderId);
                return returnFAIL(res, err.message);
            }else{
                for(var i in SOCKETS.cashier){
                    SOCKETIO.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('feedbackOrder',{orderId: data.orderId});
                }
                return returnSUCCESS(res, "退单成功");
            }
        })
    }else{
        return returnFAIL(res, '缺少参数');
    }
});


module.exports = router;