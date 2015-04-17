/**
 * @module controllers/flawor
 * @description 菜品口味的路由
 * @author 冀玉鑫
 * @modified By
 */
var router = require('express').Router();
var flavor = require(PROXY).flavor;
var validator = require('validator');
var syncData = require(BASEDIR+ '/app/common/utils/syncData');
/**
 * 根据条件查询口味
 * @param id : 口味ID
 * @param name : 口味名称
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: flavors}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/query' , function (req, res) {
    var params = req.body;

    //定义查询条件
    var query = {};
    if(params._id){
        query['_id'] = params._id;
    }
    if(params.name){
        query['name'] = params.name;
    }
    flavor.getFlavorByQuery(query, null, function(error, flavors){
        if(error){  //如果有错误，则输出错误信息
            return returnFAIL(res, error.message);

        }else{ //否则返回全部口味
            return returnSUCCESS(res, flavors);
        }
    });
});

/**
 * 根据条件查询口味数量
 * @param id : 口味ID
 * @param name : 口味名称
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: count}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/count' , function (req, res) {
    var params = req.body;

    //定义查询条件
    var query = {};
    if(params._id){
        query['_id'] = params._id;
    }
    if(params.name){
        query['name'] = params.name;
    }
    flavor.getFlavorCount(query, function(error, count){
        if(error){  //如果有错误，则输出错误信息
            return returnFAIL(res, error.message);

        }else{ //否则返回口味数量
            return returnSUCCESS(res, count);
        }
    });
});

/**
 * 新增口味
 * @param name : 口味名称
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: jellybean._id}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/add' , function (req, res) {
    var params = req.body;

    if(!params.name) {
        return returnFAIL(res, "请输入口味名称");

    }else{
        //新增的商品类型对象
        var newflavor = {
            name : params.name
            ,remark : params.remark
        };

        flavor.addFlavor(newflavor, function(error, jellybean){
            if(error){
                return returnFAIL(res, error.message);

            }else{
                syncData.syncFlavor(jellybean._id);
                return returnSUCCESS(res, jellybean._id);
            }
        });
    }
});

/**
 * 修改口味
 * @param id : 口味ID
 * @param name : 口味名称
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: "修改口味成功"}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/update' , function (req, res) {
    var params = req.body;

    if(params._id){
        //更新口味的查询条件
        var query = {
            _id : params._id
        };

        if(isEmptyObject(params)){
            return returnFAIL(res, "没有要修改的内容");

        }else{
            flavor.updateFlavor(query, params, function(error, doc){
                if(error){ //如果有错误，则输出错误信息
                    return returnFAIL(res, error.message);

                }else{ //否则返回修改成功
                    syncData.syncFlavor(query._id);
                    return returnSUCCESS(res, "修改口味成功");
                }
            });
        }
    }else{
        return returnFAIL(res, "请选择要修改的口味");
    }
});

/**
 * 批量删除口味
 * @param _id : 口味ID
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: "删除口味成功"}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/delete' , function (req, res) {
    var id = req.body._id.trim();

    if(id){
        //删除的条件
        var query = {
            _id: id
        };
        flavor.removeFlavor(query, function (error) {
            if (error) {  //如果有错误，则输出错误信息
                return returnFAIL(res, error.message);
            }else{
                syncData.syncFlavor(query._id);
                return returnSUCCESS(res, "删除口味成功");
            }
        });
    }else{
        return returnFAIL(res, "请选择删除的口味");
    }
});

module.exports = router;