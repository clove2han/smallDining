/**
 * 2014/12/2
 * @module
 * @description 供应时间段管理
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var supplyTime = require(PROXY).supplyTime;
var tool = require(BASEDIR + '/app/common/utils/tool');
var validator = require('validator');
var syncData=require(BASEDIR+'/app/common/utils/syncData');
/*
* 添加供应时间段
* 接口数据
* {
*   name:,
*   img:
* }
* */
router.post('/add', function (req, res) {
    var params = tool.deleteNull(validator,req.body);

    supplyTime.createOneSupplyTime(params, function (err, supplyTimeData) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            syncData.syncSupplyTime(supplyTimeData._id);
            return returnSUCCESS(res, "添加成功");
        }
    })
});

/*
* 删除供应时间段
* */
router.post('/remove', function (req, res) {
    var _id = req.body._id;
    if(!_id){
        return returnFAIL(res, "缺少参数");
    }
    supplyTime.removeOneSupplyTime({_id: _id}, function (err, supplyTimeData) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            syncData.syncSupplyTime(_id);
            return returnSUCCESS(res, "删除成功");
        }
    });
});

/*
 * 查询供应时间段
 * */
router.post('/query', function (req, res) {
    var params = tool.deleteNull(validator,req.body) || {};
    if(params.name){
        params.name = new RegExp(params.name);
    }
    supplyTime.querySupplyTime(params, function (err, supplyTimeData) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, supplyTimeData);
        }
    });
});

/*
 * 修改供应时间段
 * */
router.post('/update', multipartMiddleware, function (req, res) {
    var params = tool.deleteNull(validator,req.body);

    var condition = {}, update = {};
    if(params._id){
        condition._id = params._id;
        delete params._id;
    }else{
        return returnFAIL(res, "缺少对象");
    }

    if(params){
        update.$set = params;
    }else{
        return returnFAIL(res, "没有修改内容");
    }

    supplyTime.updateOneSupplyTime(condition, update, function (err, SupplyTime) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            syncData.syncSupplyTime(params._id);
            return returnSUCCESS(res, "修改成功");
        }
    });
});

module.exports = router;
