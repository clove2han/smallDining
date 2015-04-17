/**
 * 2014/12/3
 * @module
 * @description 酒店模式公共更改台状态和订单状态的socket
 * @author 黄耀奎
 * @modified By
 */
var table = require(PROXY).table;
var restOrders = require(PROXY).restOrders;
var validator = require('validator');
var tool = require(BASEDIR + '/tools/tool');

module.exports = function (io, socket) {
    //返回socketId
    socket.emit('getSocketId',{socketId:socket.id});
    //储存对应端的socketId
    socket.on('saveSocketId', function (data) {
        var socketObj = {};
        var isSave = true;
        if(data.socketId && data.cashierName){
            //判断当前socketId是否储存过？
            SOCKETS.cashier.forEach(function(item){
                if(item.cashierSocketId == data.socketId){
                    isSave = false ;
                }
            });
            if(isSave){
                socketObj = {cashierName: data.cashierName, cashierSocketId: data.socketId};
//                socketObj = {cashierName: data.cashierName, cashierSocketId: data.socketId, number: data.number};
                SOCKETS.cashier.push(socketObj);
            }
        }else{
            socket.emit('error', {'ResultCode': 'FAIL', 'Result': '缺少参数'});
        }
    });

    socket.on('disconnect', function(){
        var socketId = socket.id;

        //socket断开后不会释放内存,手动删除socket.io里的对象，去掉对象的引用, 让gc回收内存
        delete io.sockets.sockets[socketId];

        //如果收银端结束了socket连接,从queues里删除
        SOCKETS.queues.forEach(function (item, index) {
            if(item.queueSocketId == socketId){
                SOCKETS.queues.splice(index,1);
            }
        });
        //如果收银端结束了socket连接,从cashier里删除
        SOCKETS.cashier.forEach(function (item, index) {
            if(item.cashierSocketId == socketId){
                SOCKETS.cashier.splice(index,1);
            }
        });
        //如果客显端结束了socket连接,从show里删除
        SOCKETS.show.forEach(function (item, index) {
            if(item.showSocketId == socketId || item.cashierSocketId == socketId){
                SOCKETS.show.splice(index,1);
            }
        });
        //如果厨师端结束了socket连接,从kitche里删除
        SOCKETS.kitchen.forEach(function (item, index) {
            if(item.kitchenSocketId == socketId){
                SOCKETS.kitchen.splice(index,1);
            }
        });
        //如果服务员端结束了socket连接,从里删除
        SOCKETS.waiter.forEach(function (item, index) {
            if(item.waiterSocketId == socketId){
                SOCKETS.waiter.splice(index,1);
            }
        });
        //如果上菜端结束了socket连接,从里删除
        SOCKETS.goFood.forEach(function (item, index) {
            if(item.goFoodSocketId == socketId){
                SOCKETS.goFood.splice(index,1);
            }
        });
        //当服务员端异常退出后，socket中断时，进行对台绑定解除
        BINDTABLE.forEach(function (item, index) {
            if(item.waiterSocketId == socketId){
                BINDTABLE.splice(index,1);
            }
        });
        //当备菜端结束了socket连接,从里删除
        SOCKETS.prepare.forEach(function (item, index) {
            if(item.prepareSocketId == socketId){
                SOCKETS.prepare.splice(index,1);
            }
        });
    });
};