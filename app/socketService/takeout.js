/**
 * 2014/12/3
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var config = require(BASEDIR + '/app/config/config.json')
    ,tool = require(BASEDIR + '/app/common/utils/tool')
    ,socket_client = require('socket.io-client')(tool.getSmallWalletPath())
    ,restOrders = require(PROXY).restOrders
    ,dishesOrder = require(PROXY).dishesOrder
    ,moment = require('moment');


module.exports = function (io) {

    socket_client.on('connect', function(){
        console.log("连接上小猫服务器");
    });

    //接到socketId后把对应的商店Id一起发回小猫钱包服务器进行客户端绑定
    socket_client.on('getSocketId', function (data) {
        console.log('获取socketId');
        var content = {shopId:tool.getDiningId(), socketId: data.socketId};
        socket_client.emit('saveScoketId', content);
    });

    //接收外卖订单接口
    socket_client.on('sendTakeoutOrder', function (data) {
        console.log('接收了外卖订单');

        console.log(data);
        //进行外卖订单的储存
        //暂时不存模式,等收银端确认的时候，根据哪个模式的收银端确认修改模式

        var takeoutOrder = {
            _id: data._id
            ,orderNumber: data.orderCode
            ,orderType: 2
            ,totalPrice: data.totalPrice
            ,isPack:true
            ,deliverInfo:{
                deliverTime: data.deliveryTime == 0 ? moment() : moment(data.deliveryTime)
                ,deliverAddr: data.deliveryAddress
                ,telephone: data.phone
                ,linkman: data.linkman
                ,isPayOnDelivery: data.isPayOnDelivery
                ,orderTime: data.orderTime
                ,state: data.state || 1
            }
        };

        if(data.state && data.state > 0 && data.userId && (data.payMethod == 'SWSW')){
            takeoutOrder.orderState = 1;
            takeoutOrder.payment = [{
                paymentMethod: 7,
                paymentId: data.userId,
                price: data.totalPrice

            }];
        }

        //所点的菜
        var dishes = [];
        var good = {};

        data.goods.forEach(function (item, index) {
            good = {
                "orderId":data._id,
                "dishTypeId":item.shopDishesTypeId,
                "dishesId": item.dishesId, 	                // 菜品ID
                "name": item.name, 		    				// 菜品名称
                "price": item.price, 						// 菜品单价
                "quantity": item.quantity,	    			// 数量
                "state": 0,
                "type": 2,
                "waiter": "外卖"
            };
            dishes.push(good);
        });

        restOrders.addRestOrders(takeoutOrder, function (err, restOrdersData) {

            console.log(restOrdersData);

            if(err){
                socket_client.emit('error', err.message);
            }else{
                var orderId = String(restOrdersData._id);

                dishesOrder.saveDishesOrders(dishes, function (err, dishesOrdersData) {
                    if(err){
                        restOrders.removeDishesOrder({_id: orderId}, function (err) {
                        });
                        socket_client.emit('error', err.message);
                    }else{
                        for(var i in SOCKETS.cashier){
                            io.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('getTakeoutOrder',"newOrder");
                        }
                        socket_client.emit('success', {'Result': '成功'});
                    }
                })
            }
        });
    });

    /**
     * 催单
     * */
    socket_client.on('urging', function (data) {
        //data {_id}

        var query = {}, update = {};
        if(!data._id){
            socket_client.emit('error', {'Result': '缺少对象'})
        }else{
            query._id = data._id;
            update.$set = {"deliverInfo.isUrging": true};
            console.log(query._id);
            restOrders.updateRestOrders(query, update, function (err, restOrderData) {
                if(err){
                    socket_client.emit('error', {'Result': err.message})
                }else{

                    if(tool.isObjectEmpty(restOrderData)){
                        socket_client.emit('error', "操作失败");
                    }else{
                        for(var i in SOCKETS.cashier){
                            io.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('sendUrging', query);
                        }
                        socket_client.emit('success', "成功");
                    }

                }
            })
        }
    });

    /*
    * 退单
    * */
    socket_client.on('backOrder', function (data) {
        //data {_id}

        var query = {}, update = {};
        if(!data._id){
             socket_client.emit('error', {'Result': '缺少对象'})
        }else{
            query = {_id: data._id, "deliverInfo.state": {$lt: 4}, 'backState':0};
            update.$set = { "backState": 1, "onLineChangeBackApply.applyTime": new Date(), "onLineChangeBackApply.changeBackCause": data.changeBackCause, "deliverInfo.isUrging": false};

            restOrders.updateRestOrders(query, update, function (err, restOrderData) {
                if(err){
                    socket_client.emit('error', {'Result': err.message});
                }else{
                    if(tool.isObjectEmpty(restOrderData)){

                        socket_client.emit('error', {'Result': "操作失败"})
                    }else{
                        for(var i in SOCKETS.cashier){
                            io.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('backOrder', query);
                        }

                        socket_client.emit('success', "成功");
                    }
                }
            })
        }

    });


    /**
     *支付
     * @param data json
     */
    socket_client.on('pay', function (data) {
        /**
         * orderId, userId, price
         */

        if(data.orderId && data.userId && data.price){
            var userId = data.userId;
            var price = data.price;
            var query = {_id: data.orderId, orderState:0};

            restOrders.getOneOrder(query, function (err, result) {
                if(err){

                    socket_client.emit('error', {'Result': err.message});
                }else{

                    if(tool.isObjectEmpty(result)){
                        socket_client.emit('error', {'Result': '操作失功'});
                    }else{
                        if(result.totalPrice == price){
                            var update = {$push:
                                {
                                    paymentMethod: 7,
                                    paymentId: userId,
                                    price: price
                                }
                            };
                            update.$set = {'deliverInfo.isPayOnDelivery': true};
                            restOrders.updateRestOrders(query, update, function (err){
                                if(err){
                                    socket_client.emit('error', {'Result': err.message});
                                }else{
                                    socket_client.emit('success', "操作成功");
                                }
                            });
                        }else{
                            socket_client.emit('error', {'Result': '金额错误'});
                        }
                    }
                }
            });
        }else{
            socket_client.emit('error', {'Result': '缺少参数'});
        }
    });

    socket_client.on('disconnect', function(){
        console.log("与小猫服务器连接中断");
    });

 };

