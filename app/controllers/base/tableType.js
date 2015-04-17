/**
 * @module       controllers/tableType
 * @description
 * @author
 * @modified By 韩皎
 */

var router = require('express').Router();
var tableType = require(PROXY).tableType;
var validator = require('validator');
var tool = require(BASEDIR + '/app/common/utils/tool');
var push = require(BASEDIR + '/app/common/utils/push');
var syncData=require(BASEDIR+'/app/common/utils/syncData');

/**
 * 根据条件查询台位
 * @param name : 台位类型名称
 * return
 *  SUCCESS : {flag: true, message: "", tableType: tableType}
 *  FAIL    : {flag: false, message: error.message}
 */
router.post('/query' , function (req, res) {
    var params = req.body;
    //定义查询条件
    var query = {};
    if(params._id) {
        query['_id'] = params._id;
    }
    if(params.name) {
        query['name'] = params.name;
    }
    if(params.sort) {
        query['sort'] = params.sort;
    }
    if(params.number) {
        query['number'] = params.number;
    }
    if(params.state){
        query['state'] = params.state;
    }
    query.isDel = false;
    tableType.getTableTypeByQuery(query, null, function(err, tableType){
        if(err){  //如果有错误，则输出错误信息
            return returnFAIL(res, err.message);
        }else{ //否则返回全部台位
            return returnSUCCESS(res, tableType);
        }
    });
});

/**
 * 新增台位类型
 * @param {（台位类型所有属性）}
 * return
 *  SUCCESS : {flag: true, message: "新增台位类型成功", id: jellybean._id}
 *  FAIL    : {flag: false, message: error.message}
 */
router.post('/add' , function (req, res) {
    var params = deleteNull(validator, req.body);
    if(params.state){
        params.state = parseInt(newTableType.state);
    }
    if(params.sort){
        params.sort = parseInt(newTableType.sort);
    }
    if(params.number){
        params.number = parseInt(newTableType.number);
    }
    if(!params.name){
        return returnFAIL(res, "台位名称不能为空");
    }else{
        async.auto({
            getTableTypeInfo: function (cb) {
                //添加前判断是否是之前删除过的菜品，如果是把恢复并修改它
                tableType.getOneTableType({name: params.name, isDel:true}, function (err, tableTypeData) {
                    cb(err, tableTypeData);
                });
            },
            waitDishesInfo: ['getTableTypeInfo', function (cb, data) {
                var tableTypeInfo = data.getTableTypeInfo;

                if(tool.isObjectEmpty(tableTypeInfo)){
                    tableType.addTableType(params, function(err, data){
                        cb(err, data);
                    });

                }else{
                    params.isDel = false;
                    params.isUpload = false;
                    var update = {$set: params};

                    tableType.updateTableType({_id: tableTypeInfo._id}, update, function (err, result) {
                        cb(err, result);

                    })
                }
            }]
        }, function (err, data) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                syncData.syncTableType(data._id);
                return returnSUCCESS(res, "新增台位类型成功");
            }
        });
    }
});

/**
 * 修改台位类型
 * @param {（台位所有属性）}
 * return
 *  SUCCESS : {flag: true, message: "修改台位成功"}
 *  FAIL    : {flag: false, message: error.message}
 */
router.post('/update' , function (req, res) {
    var params = deleteNull(validator,req.body);
    var query = {},update = {};
    query._id = params._id;
    delete params._id;
    update = params;
    if(update.number){
        update.number = parseInt(update.number);
    }
    if(update.sort){
        update.sort = parseInt(update.sort);
    }
    tableType.getTableTypeByQuery({name: update.name, _id:{$ne:query._id}}, {}, function (err, tableInfo) {
        if(err){
            return returnFAIL(res, err.message)
        }else{
            if(tableInfo.length > 0){
                return returnFAIL(res, '台位类型名称重复')
            }else{
                update.isUpload = false;
                tableType.updateTableType(query, {$set: update}, function (err, data) {
                    if(err){
                        return returnFAIL(res, err.message)
                    }else{
                        syncData.syncTableType(data._id);
                        return returnSUCCESS(res, '修改成功')
                    }
                });
            }
        }
    });
});

/**
 * 删除台位类型
 * @param name : 台位类型名称
 * return
 *  SUCCESS : {flag: true, message: "删除台位类型成功"}
 *  FAIL    : {flag: false, message: error.message}
 */

router.post('/delete' , function (req, res) {
    var id = req.body._id.trim();
    if(id){
        var query = {
            _id: id
        };
        tableType.updateTableType(query, {$set: {isDel: true, isUpload:false}},function (err) {
            if (err) {
                return returnFAIL(res, err.message);
            }else{

                syncData.syncTableType(id);
                return returnSUCCESS(res, "删除台位类型成功");
            }
        });
    }else{
        return returnFAIL(res, "请选择要删除的台位类型");
    }
});

module.exports = router;