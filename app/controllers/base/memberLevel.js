/**
 * @module controllers/memberLevel
 * @description 会员等级
 * @author 韩皎
 * @modified By 黄耀奎
 */
var router = require('express').Router();
var memberLevel = require(PROXY).memberLevel;
var validator = require('validator');
var tool = require(BASEDIR + '/tools/tool');
var syncData=require(BASEDIR+'/tools/syncData');
/**
 * 查询会员等级  (当条件为空时，查询所有数据)
 * @param 会员id
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: member}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/query' , function (req, res) {
    var params = deleteNull(validator,req.body);
    //定义查询条件
    var query = {};
    if(params.name) {
        query['name'] = new RegExp(params.name);
    }
    if(params._id){
        query['_id'] = params._id;
    }
    memberLevel.getMemberLevel(query, null, function(err, memberLevel){
        if(err){  //如果有错误，则输出错误信息
            return returnFAIL(res, err.message);
        }else{ //否则返回全部排队号
            return returnSUCCESS(res, memberLevel);
        }
    });
});

/**
 * 添加会员等级
 * @param 会员等级信息
 * return
 *  SUCCESS : {resultCode: 'SUCCESS, result: "新增会员等级成功"}
 *  FAIL    : {resultCode: 'FAIL, result: error.message}
 */
router.post('/add' , function (req, res) {
    //删除新增对象中的空值
    var newMemberLevel = deleteNull(validator,req.body);
    if(newMemberLevel.minAmount){
        newMemberLevel.minAmount = Math.abs(newMemberLevel.minAmount);
    }
    if(newMemberLevel.maxAmount){
        newMemberLevel.maxAmount = Math.abs(newMemberLevel.maxAmount);
    }
    if(newMemberLevel.discounts){
        newMemberLevel.discounts = Math.abs(newMemberLevel.discounts);
    }
    memberLevel.addMemberLevel(newMemberLevel, function(err){
        if(err){  //如果有错误，则输出错误信息
            return returnFAIL(res, err.message);
        }else{
            syncData.syncMemberLevel(newMemberLevel._id);
            return returnSUCCESS(res, "添加成功");
        }
    });
});

/**
 * 删除会员等级
 * @param name ： 等级名称
 * return
 *  SUCCESS : {resultCode: 'SUCCESS, result: "删除会员等级成功"}
 *  FAIL    : {resultCode: 'FAIL, result: error.message}
 */

router.post('/delete' , function (req, res) {
    var id = req.body._id.trim();
    if(id){
        var query = {
            _id: id
        };
        memberLevel.remove(query, function (err) {
            if (err) {  //如果有错误，则输出错误信息
                return returnFAIL(res, err.message);
            }else{
                syncData.syncMemberLevel(query._id);
                return returnSUCCESS(res, "删除会员等级成功");
            }
        });
    }else{
        return returnFAIL(res, "请选择要删除的会员等级");
    }
});

/**
 * 修改会员等级信息
 * @param 会员等级所有属性
 * return
 *  SUCCESS : {resultCode: 'SUCCESS, result: "修改会员等级成功"}
 *  FAIL    : {resultCode: 'FAIL, result: error.message}
 */
router.post('/update' , function (req, res) {
    var query = {}, update = {}, updateContent = {};
    var params = deleteNull(validator, req.body);
    if(params._id){
        query._id = params._id;
        delete params._id;
    }else{
        return returnFAIL(res, "没有修改对象")
    }
    if(params.name){
        updateContent.name = params.name;
    }
    if(params.minAmount){
        updateContent.minAmount = parseFloat(Math.abs(params.minAmount));
    }
    if(params.maxAmount){
        updateContent.maxAmount = parseFloat(Math.abs(params.maxAmount));
    }
    if(params.discounts){
        updateContent.discounts = parseFloat(Math.abs(params.discounts));
    }
    update = {$set: updateContent};

    if(tool.isObjectEmpty(update.$set)){
        return returnFAIL(res, "没有要修改的内容！");
    }else{
        memberLevel.updateMemberLevel(query, update, function(err){
            if(err){ //如果有错误，则输出错误信息
                return returnFAIL(res, err.message);
            }else{ //否则返回修改成功
                syncData.syncMemberLevel(query._id);
                return returnSUCCESS(res, "修改成功");
            }
        });
    }
});

module.exports = router;

