/**
 * @module controllers/pointsRule
 * @description 积分规则
 * @author 韩皎
 * @modified By
 */

var router = require('express').Router();
var pointsRule = require(PROXY).pointsRule;
var validator = require('validator');
var syncData=require(BASEDIR+'/app/common/utils/syncData');

/**
 * 查询积分规则
 * @param id
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: pointsRule}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/query' , function (req, res) {
    pointsRule.getPointsRule(null, null, function(err, pointsRule){
        if(err){  //如果有错误，则输出错误信息
            return returnFAIL(res, err.message);
        }else{ //否则返回全部排队号
            return returnSUCCESS(res, pointsRule);
        }
    });
});

/**
 * 添加积分规则
 * @param 积分规则信息
 * return
 *  SUCCESS : {resultCode: 'SUCCESS, result: "新增积分规则"}
 *  FAIL    : {resultCode: 'FAIL, result: error.message}
 */
router.post('/add' , function (req, res) {

    //新增的积分规则
    var newPointsRule={
        consumer:parseFloat(req.body.consumer),   // 消费金额
        returnPoints :parseFloat(req.body.returnPoints)  // 返还积分
    };

    if(newPointsRule.consumer === '') {
        return returnFAIL(res, "请输入等级最小金额");
    }
    if(newPointsRule.returnPoints ==='') {
        return returnFAIL(res, "请输入等级最大金额");
    }

    pointsRule.addPointsRule(newPointsRule, function(err, jellybean, snickers){
        if(err){  //如果有错误，则输出错误信息
            return returnFAIL(res, err.message);
        }else{
            syncData.syncPointsRule(jellybean._id);
            return returnSUCCESS(res, newPointsRule);
        }
    });
});

/**
 * 修改积分规则
 * @param 积分规则信息
 * return
 *  SUCCESS : {resultCode: 'SUCCESS, result: update}
 *  FAIL    : {resultCode: 'FAIL, result: error.message}
 */
router.post('/update' , function (req, res) {
    var id = req.body._id;
    //要更新的积分规则
    var update={
        consumer:parseFloat(req.body.consumer),   // 消费金额
        returnPoints :parseFloat(req.body.returnPoints)  // 返还积分
    };
    if(id){
        //更新查询条件
        var query = {
            _id : id
        };
        update = deleteNull(validator,update);
        if(isEmptyObject(update)){
            return returnFAIL(res, "没有要修改的内容！");
        }else{
            pointsRule.updatePointsRule(query, update, function(err){
                if(err){ //如果有错误，则输出错误信息
                    return returnFAIL(res, err.message);
                }else{ //否则返回修改成功
                    syncData.syncPointsRule(query._id);
                    return returnSUCCESS(res, update);
                }
            });
        }
    }else{
        return returnFAIL(res, "请选择要修改的规则！");
    }
});

module.exports = router;