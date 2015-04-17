/**
 * 2015/4/9
 * @module
 * @description socket队列
 * @author 冀玉鑫
 * @modified By
 */
var router = require('express').Router();
var moment = require('moment');
var utils = require('utility');
var tool = require(BASEDIR + '/tools/tool');

//收银端 - 酒楼
var QUEUES_PORT = "queues";
//收银端 - 快餐/酒楼快餐
var CASHIER_PORT = "cashier";
//客显
var SHOW_PORT = "show";
//厨师端
var KITCHEN_PORT = "kitchen";
//服务员
var WAITER_PORT = "waiter";
//上菜端
var GOFOOD_PORT = "goFood";
//备菜端
var PREPARE_PORT = "prepare";

//队列
var queues = {};
//最多发送次数
var maxEmitTime = -1;
//定时器对象
var timerObj = null;
//等待多久执行
var delay = 5000;

/**
 * 定时器
 */
var timer = function(){
    if(!tool.isObjectEmpty(queues)){
        for(var i in queues){
            if(queues[i].time <= maxEmitTime){
                var nowDate = Date.now();       //当前时间毫秒值

                if(nowDate - queues[i].nowDate >= delay){       //如果重发实际和上次发送时间间隔超过可发送时间
                    console.log("没有收到回执，" + i + "重新发送 第" + queues[i].time++ + "遍");

                    queues[i].nowDate = nowDate;        //更新当前连接在队列里的时间

                    emit(queues[i].port, queues[i].port, queues[i].port, i);        //重新发送
                }
            }else{
                popEndQueue(i);     //从队列中删除结束的SOCKET连接
                console.log("socket重发已经超过"+ maxEmitTime +"次");
            }
        }
    }else if(timerObj && timerObj._idleTimeout != -1){
        console.log("队列为空，停止定时器");
        clearInterval(timerObj);
    }
};

/**
 * 发送socketIo
 * @param port ： 要发送的端（1.queues:收银端 2.cashier:收银端 3.show:客显 4.kitchen: 厨师端 5.waiter：服务员 6.goFood: 上菜端 7.prepare:备菜端）
 * @param socketUrl : socket地址
 * @param data  ： 要发送的数据
 * @param queueId : 队列ID
 * @param callback : 回调函数
 */
var emit = function (port, socketUrl, data, queueId, callback) {
    var ioObj = getIoByPort(port);
    if(ioObj){
        for (var i in ioObj.ios) {
            if(!queueId){
                var newQueueId = createQueueId();
                queues[newQueueId] = {
                    port: port
                    ,socketUrl: socketUrl
                    ,data: data
                    ,time: 1
                    ,nowDate: Date.now()
                };
                callback(newQueueId);
                queueId = newQueueId;
            }
            data.queueId = queueId;
            SOCKETIO.sockets.socket(ioObj.ios[i][ioObj.socketId]).emit(socketUrl, {'ResultCode': 'SUCCESS', 'Result': data});
            if(!timerObj || timerObj._idleTimeout == -1){
                console.log("第一次---");
                timerObj = setInterval(timer, delay);
            }
        }
    }else{
        console.log("发送SOCKETIO失败");
    }
};

//从队列中删除结束的SOCKET连接
var popEndQueue = function(queueId){
    if(queues[queueId]) {
        delete queues[queueId];
    }
};

/**
 * 创建队列Id
 * @return {string} 订单号
 */
function createQueueId() {
    return moment().format('YYYYMMDDHHmmss') + utils.randomString(4, '0123456789');
}

//根据端名称获取IO对象
var getIoByPort = function(port){
    var ioObj = {};
    switch (port){
        case QUEUES_PORT:
            ioObj.ios = SOCKETSs.queues;
            ioObj.socketId = "queuesSocketId";
            break;
        case CASHIER_PORT:
            ioObj.ios = SOCKETSs.cashier;
            ioObj.socketId = "cashierSocketId";
            break;
        case SHOW_PORT:
            ioObj.ios = SOCKETSs.show;
            ioObj.socketId = "showSocketId";
            break;
        case KITCHEN_PORT:
            ioObj.ios = SOCKETSs.kitchen;
            ioObj.socketId = "kitchenSocketId";
            break;
        case WAITER_PORT:
            ioObj.ios = SOCKETSs.waiter;
            ioObj.socketId = "waiterSocketId";
            break;
        case GOFOOD_PORT:
            ioObj.ios = SOCKETSs.goFood;
            ioObj.socketId = "goFoodSocketId";
            break;
        case PREPARE_PORT:
            ioObj.ios = SOCKETSs.prepare;
            ioObj.socketId = "prepareSocketId";
            break;
        default :
            ioObj = null;
    }
    return ioObj;
};

/**
 * 接收SocketIo的反馈
 */
router.post('/socketFeedback', function(req, res){
    var params = req.body;
    if(params.queueId){
        popEndQueue(params.queueId);
        return returnSUCCESS(res, "成功");
    }else{
        return returnFAIL(res, "socketIo反馈缺少参数");
    }
});

//test
//var SOCKETSs = {};
//SOCKETSs.kitchen = [{"kitchenSocketId":"123"}];
//
///**
// * 接收SocketIo的反馈
// */
//router.post('/test', function(req, res){
//    console.log("SOCKET 测试");
//    emit("kitchen", "test", {"a": "222"}, null, function(id){
//        return returnSUCCESS(res, id);
//    });
//});

module.exports.emit = emit;
module.exports = router;