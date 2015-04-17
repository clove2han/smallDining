/**
 * @module       controllers/queue
 * @description
 * @author 韩皎
 * @modified By 黄耀奎
 */
var router = require('express').Router();
var queue = require(PROXY).queue;
var tableType = require(PROXY).tableType;
var validator = require('validator');
var saveSocket = require(CONTROLLERS + '/common/saveSocket');

/*
保存迎宾端的socket
 */
router.post('/saveSocketId', function (req, res) {
    saveSocket.saveQueue(req.body, function (err) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, "保存成功");
        }
    });
});


/**
 * 根据排位号查询  (当条件为空时，查询所有数据)
 * @param queueNumber : 排队号
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: queue}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/query' , function (req, res) {
    var params = req.body;
    //定义查询条件
    var query = {};
    if(params.queueNumber) {
        query['queueNumber'] = params.queueNumber;
    }
    queue.getQueueByQuery(query, null, function(err, queue){
        if(err){  //如果有错误，则输出错误信息
            return returnFAIL(res, err.message);

        }else{ //否则返回全部排队号
            return returnSUCCESS(res, queue);
        }
    });
});

/**
 * 新增排位号
 * @param {mealsNumber:就餐人数}
 * return
 *  SUCCESS : {resultCode: 'SUCCESS, result: "新增排队号成功", id: jellybean._id}
 *  FAIL    : {resultCode: 'FAIL, result: error.message}
 */
router.post('/add' , function (req, res) {
    //获取网页元素
    var params = req.body;
    if(!params.mealsNumber) {
        return returnFAIL(res, "请输入就餐人数");
    }else{
        //查询数据库中最大的排序号
        queue.getQueueNumberByMaxSort(function(err, sortRes){

            if(err){  //如果有错误，则输出错误信息
                return returnFAIL(res, err.message);
            }else{
                //查询tableType表中的number数组
                tableType.getNumber(null,null,function(error,sortNumber){
                    //新增的排队对象
                    var newQueue = {
                        queueNumber  : sortRes.length > 0 ? parseInt(sortRes[0].queueNumber) + 1 : 1, //排队号，自动生成
                        mealsNumber  : parseInt(params.mealsNumber),                                  //就餐人数，非空
                        createDate   : new Date()
                    };

                    //当就餐人数小于最小台位可坐人数时，分配最小的台位
                    if(newQueue['mealsNumber'] < sortNumber[0].number){
                        newQueue['tableTypeName'] = String(sortNumber[0].name);
                        newQueue['tableTypeId'] = String(sortNumber[0]._id);
                     // 当就餐人数大于等于台位最大可坐人数时，分配最大的台位
                    }else if(newQueue['mealsNumber']>=sortNumber[sortNumber.length-1].number){
                        newQueue['tableTypeName'] = String(sortNumber[sortNumber.length-1].name);
                        newQueue['tableTypeId'] = String(sortNumber[sortNumber.length-1]._id);
                    }else{
                        for(var i =0;i<sortNumber.length;i++){
                            if(newQueue['mealsNumber'] <= sortNumber[0].number){
                                newQueue['tableTypeName'] = String(sortNumber[0].name);
                                newQueue['tableTypeId'] = String(sortNumber[0]._id);
                            }else if(newQueue['mealsNumber'] > sortNumber[i].number && newQueue['mealsNumber'] <= sortNumber[i+1].number){
                                newQueue['tableTypeName'] =String(sortNumber[i+1].name);
                                newQueue['tableTypeId'] =String(sortNumber[i+1]._id);
                            }
                        }
                    }
                    queue.addQueue(newQueue, function(err, jellybean){
                        if(err){  //如果有错误，则输出错误信息
                            return returnFAIL(res, err.message);
                        }else{   //否则返回新增的排队号
                            return returnSUCCESS(res,newQueue);
                        }
                    });
                });
            }
        });
    }
});

/**
 * 删除排队号
 * @param queueNumber : 排队号
 * return
 *  SUCCESS : {flag: true, message: "删除排队号成功"}
 *  FAIL    : {flag: false, message: error.message}
 */

router.post('/delete' , function (req, res) {
    var queueNumber = parseInt(req.body.queueNumber);
    if(queueNumber){
        var query = {
            queueNumber:queueNumber
        };
        queue.remove(query, function (err) {
            if (err) {  //如果有错误，则输出错误信息
                return returnFAIL(res, err.message);
            }else{
                return returnSUCCESS(res, "删除排队号成功");
            }
        });
    }else{
        return returnFAIL(res, "请选择要删除的排队号");
    }
});

module.exports = router;