/**
 * 2014/11/21
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var dishes = require(PROXY).dishes;
var dishesOrder = require(PROXY).dishesOrder;
var restOrders = require(PROXY).restOrders;
var transatcion = require(PROXY).transatcion;
var rechargeLog = require(PROXY).rechargeLog;
var pointsRule = require(PROXY).pointsRule;
var diningMember = require(PROXY).diningMember;
var tool = require(BASEDIR + '/tools/tool');
var async = require('async');

module.exports = function (io, socket) {
    /**
     * 快餐模式点菜时，点击其中一个菜时，触发这个事件  
     * @param  {json} data    传进菜的信息
     * @return {json}         返回菜的信息
     */
    socket.on('clickDishes', function  (data) {
        //data = {cashierSocketId:, imgName: ,price: ,name:, number}
        //对应着这个收银端的所有客显socketId都发一次

        if (!data.cashierSocketId) {
            socket.emit('error', {'ResultCode': 'FAIL', 'Result': '缺少对象'});
        }else{
            var number = -1;
            SOCKETS.cashier.forEach(function(item){
                if(item.cashierSocketId == data.cashierSocketId){
                    number = item.number;
                }
            });

            delete data.cashierSocketId;
            SOCKETS.show.forEach(function  (item) {
                if(item.number == number){
                    io.sockets.socket(item.showSocketId).emit('getShowContent', data);
                }
            });
        }
    });

//    totalPrice: 0 //总额
//    state: 0      //状态：  0：默认  1：刷卡  2：取消
    socket.on('showMemberPay', function  (data) {
        //对应着这个收银端的所有客显socketId都发一次


        if (!data.cashierSocketId) {
            socket.emit('error', {'ResultCode': 'FAIL', 'Result': '缺少对象'});

        }else{

            var number = -1;
            SOCKETS.cashier.forEach(function(item){
                if(item.cashierSocketId == data.cashierSocketId){
                    number = item.number;
                }
            });

            delete data.cashierSocketId;
            SOCKETS.show.forEach(function  (item) {
                if(item.number == number){
                    io.sockets.socket(item.showSocketId).emit('showPayInfo', data);
                }
            });
        }
    });

};