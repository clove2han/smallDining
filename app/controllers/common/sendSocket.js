/**
 * 2015/1/22
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var tool = require(BASEDIR + '/app/common/utils/tool');

var queues = function (eventName, arrayData) {
    if(tool.isArray(arrayData)){
        arrayData.forEach(function (item) {
            for(var i in SOCKETS.queues){
                SOCKETIO.sockets.socket(SOCKETS.queues[i].queueSocketId).emit(eventName,{'ResultCode': 'SUCCESS', 'Result': item});
            }
        })
    }else{
        for(var i in SOCKETS.queues){
            SOCKETIO.sockets.socket(SOCKETS.queues[i].queueSocketId).emit(eventName,{'ResultCode': 'SUCCESS', 'Result': arrayData});
        }
    }
};


var waiter = function (eventName, arrayData) {
    if(tool.isArray(arrayData)){
        arrayData.forEach(function (item) {
            for(var i in SOCKETS.waiter){
                SOCKETIO.sockets.socket(SOCKETS.waiter[i].waiterSocketId).emit(eventName,{'ResultCode': 'SUCCESS', 'Result': item});
            }
        })
    }else{
        for(var i in SOCKETS.waiter){
            SOCKETIO.sockets.socket(SOCKETS.waiter[i].waiterSocketId).emit(eventName,{'ResultCode': 'SUCCESS', 'Result': arrayData});
        }
    }
};


var cashier = function (eventName, arrayData) {
    if(tool.isArray(arrayData)){
        arrayData.forEach(function (item) {
            for(var i in SOCKETS.cashier){
                SOCKETIO.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit(eventName,{'ResultCode': 'SUCCESS', 'Result': item});
            }
        })
    }else{
        for(var i in SOCKETS.cashier){
            SOCKETIO.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit(eventName,{'ResultCode': 'SUCCESS', 'Result': arrayData});
        }
    }
};

var kitchen = function (eventName, arrayData) {
    if(tool.isArray(arrayData)){
        arrayData.forEach(function (item) {
            for(var i in SOCKETS.kitchen){
                SOCKETIO.sockets.socket(SOCKETS.kitchen[i].kitchenSocketId).emit(eventName,{'ResultCode': 'SUCCESS', 'Result': item});
            }
        })
    }else{
        for(var i in SOCKETS.kitchen){
            SOCKETIO.sockets.socket(SOCKETS.kitchen[i].kitchenSocketId).emit(eventName,{'ResultCode': 'SUCCESS', 'Result': arrayData});
        }
    }
};

exports.queues = queues;
exports.waiter = waiter;
exports.cashier = cashier;
exports.kitchen = kitchen;

