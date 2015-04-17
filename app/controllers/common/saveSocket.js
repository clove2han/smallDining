/**
 * 2015/1/24
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var validator = require('validator');
var tool = require(BASEDIR + '/tools/tool');


var saveCashier = function (data, callback) {
    var params = tool.deleteNull(validator, data);
    var isSave = true;
    console.log(params);
    if(params.socketId && params.cashierName && params.number!=null && params.number!=""){
        //判断当前socketId是否储存过？
        SOCKETS.cashier.forEach(function(item){
            if(item.cashierSocketId == params.socketId){
                isSave = false ;
            }
        });
        if(isSave){
            var socketObj = {cashierName: params.cashierName, cashierSocketId: params.socketId, number: params.number};
            SOCKETS.cashier.push(socketObj);
        }
//        SOCKETS.show.forEach(function  (item) {
//            if(item.number == params.number){
//                io.sockets.socket(item.showSocketId).emit('haveMatching', "配对成功");
//            }
//        });
        callback(null)
    }else{
        callback({message: "缺少参数"});
    }
};

var saveKitchen = function (data, callback) {
    var params = tool.deleteNull(validator, data);
    var isSave = true;
    if(params.socketId && params.kitchenName){
        //判断当前socketId是否储存过？
        SOCKETS.kitchen.forEach(function(item){
            if(item.kitchenSocketId == params.socketId){
                isSave = false ;
            }
        });
        if(isSave){
            var socketObj = {kitchenName: params.kitchenName, kitchenSocketId: params.socketId};
            SOCKETS.kitchen.push(socketObj);

        }
        callback(null);
    }else{
        callback({message: "缺少参数"});
    }
};

var saveQueue = function (data, callback) {
    var params = tool.deleteNull(validator, data);
    var isSave = true;

    if(params.socketId && params.queueName){
        //判断当前socketId是否储存过？
        SOCKETS.queues.forEach(function(item){
            if(item.queueSocketId == params.socketId){
                isSave = false ;
            }
        });
        if(isSave){
            var socketObj = {queueName: params.queueName, queueSocketId: params.socketId};
            SOCKETS.queues.push(socketObj);
        }
        callback(null);
    }else{
        callback({message: "缺少参数"});
    }
};

var saveWaiter = function (data, callback) {
    var params = tool.deleteNull(validator, data);
    var isSave = true;

    if(params.socketId && params.waiterName){
        //判断当前socketId是否储存过？
        SOCKETS.waiter.forEach(function(item){
            if(item.waiterSocketId == params.socketId){
                isSave = false ;
            }
        });
        if(isSave){
            var socketObj = {waiterName: params.waiterName, waiterSocketId: params.socketId};
            SOCKETS.waiter.push(socketObj);
        }
        callback(null);
    }else{
        callback({message: "缺少参数"});
    }
};


var saveGoFood = function (data, callback) {
    var params = tool.deleteNull(validator, data);
    var isSave = true;

    if(params.socketId){
        //判断当前socketId是否储存过？
        SOCKETS.goFood.forEach(function(item){
            if(item.goFoodSocketId == params.socketId){
                isSave = false ;
            }
        });
        if(isSave){
            var socketObj = {goFoodSocketId: params.socketId};
            SOCKETS.goFood.push(socketObj);
        }
        callback(null);
    }else{
        callback({message: "缺少参数"});
    }
};


var savePrepare = function (data, callback) {
    var params = tool.deleteNull(validator, data);
    var isSave = true;

    if(params.socketId && params.prepareName){
        //判断当前socketId是否储存过？
        SOCKETS.prepare.forEach(function(item){
            if(item.prepareSocketId == params.socketId){
                isSave = false ;
            }
        });
        if(isSave){
            var socketObj = {prepareSocketId: params.socketId, prepareName: params.prepareName};
            SOCKETS.prepare.push(socketObj);
        }
        callback(null);
    }else{
        callback({message: "缺少参数"});
    }
};

var saveShow = function (data, callback) {
    var params = tool.deleteNull(validator, data);
    var isSave = true;
    if(params.showSocketId && params.number!=null && params.number!=""){
        //判断当前socketId是否储存过？
        SOCKETS.show.forEach(function(item){
            if(item.showSocketId == params.showSocketId){
                item.number = params.number;
                isSave = false ;
            }
        });
        if(isSave){
            var show = {showSocketId: data.showSocketId, number: params.number};
            SOCKETS.show.push(show);

            var flag = false;
            SOCKETS.cashier.forEach(function(item){
                if(item.number == data.number){
                    flag = true;
                }
            });

            if(flag){
                callback(null, "已连接，与收银端配对成功");
            }else{
                callback(null, "已连接，暂时没有可连接的收银端");
            }
        }else{
            callback(null);
        }
    }else{
        callback({message: "缺少参数"});
    }
};


exports.saveCashier = saveCashier;
exports.saveKitchen = saveKitchen;
exports.saveQueue = saveQueue;
exports.saveWaiter = saveWaiter;
exports.saveGoFood = saveGoFood;
exports.savePrepare = savePrepare;
exports.saveShow = saveShow;