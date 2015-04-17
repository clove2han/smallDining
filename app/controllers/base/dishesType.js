/**
 * @module controllers/dishesType
 * @description 菜品类型的路由
 * @author 冀玉鑫
 * @modified By
 */
var router = require('express').Router();
var dishesType = require(PROXY).dishesType;
var validator = require('validator');
var tool = require(BASEDIR + '/tools/tool');
var syncData = require(BASEDIR+ '/tools/syncData');
var dishes = require(PROXY).dishes;

/**
 * 根据条件查询菜品类型
 * @param id : 菜品类型ID
 * @param name : 菜品类型名称
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: dishesTypes}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/query', function (req, res) {
    var query = deleteNull(validator, req.body);
    query.isDel = false;
    dishesType.getDishesTypeByQuery(query, {'__v': 0}, function (error, dishesTypes) {
        if (error) {  //如果有错误，则输出错误信息
            return returnFAIL(res, error.message);

        } else { //否则返回全部菜品类型
            return returnSUCCESS(res, dishesTypes);
        }
    });
});

/**
 * 根据条件查询菜品类型数量
 * @param id : 菜品类型ID
 * @param name : 菜品类型名称
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: count}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/count', function (req, res) {
    var query = deleteNull(validator, req.body);

    dishesType.getDishesTypeCount(query, function (error, count) {
        if (error) {  //如果有错误，则输出错误信息
            return returnFAIL(res, error.message);

        } else { //否则返回菜品类型数量
            return returnSUCCESS(res, count);
        }
    });
});

/**
 * 新增菜品类型
 * @param name : 菜品类型名称
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: jellybean._id}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/add', function (req, res) {
    var params = req.body;
    if (!params.name) {
        return returnFAIL(res, "请输入菜品类型名称");

    } else {
        //查询数据库中最大的排序号
        dishesType.getDishesTypeByMaxSort(function (error, sortRes) {
            if (error) {  //如果有错误，则输出错误信息
                return returnFAIL(res, error.message);
            } else {
                //新增的商品类型对象
                var newDishesType = {
                    name: params.name, sort: sortRes.length > 0 ? sortRes[0].sort + 1 : 1
                };

                //判断是否是以前删除过的类型，如果是就把它恢复，并修改过它
                dishesType.getDishesTypeByQuery({name: params.name, isDel: true}, {}, function (err, result) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }else{
                        if(result.length > 0){
                            delete newDishesType.sort;
                            newDishesType.isDel = false;
                            newDishesType.isUpload = false;
                            var update = {$set: newDishesType};
                            dishesType.updateDishesType({_id: result[0]._id}, update, function (err, dishesTypeData) {
                                if(err){
                                    return returnFAIL(res, err.message);
                                }else{
                                    syncData.syncDishesType(dishesTypeData._id);
                                    return returnSUCCESS(res, dishesTypeData._id);
                                }
                            });
                        }else{
                            dishesType.addDishesType(newDishesType, function (error, jellybean) {
                                if (error) {  //如果有错误，则输出错误信息
                                    return returnFAIL(res, error.message);

                                } else {
                                    syncData.syncDishesType(jellybean._id);

                                    return returnSUCCESS(res, jellybean._id);
                                }
                            });
                        }
                    }
                });



            }
        });
    }
});

/**
 * 修改菜品类型
 * @param id : 菜品类型ID
 * @param name : 菜品类型名称
 * @param sort : 菜品类型排序号
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: "修改菜品类型成功"}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/update', function (req, res) {
    var params = req.body;

    if (params._id) {
        //更新菜品类型的查询条件
        var query = {
            _id: params._id
        };
        delete params['_id'];
        if (params.sort) params.sort = parseInt(params.sort, 10);

        if (tool.isObjectEmpty(params)) {
            return returnFAIL(res, "没有要修改的内容");
        } else {
            params.isUpload = false;
            var update = {$set: params};
            dishesType.updateDishesType(query, update, function (error, doc) {
                if (error) { //如果有错误，则输出错误信息
                    return returnFAIL(res, error.message);

                } else { //否则返回修改成功
                    syncData.syncDishesType(doc._id);
                    return returnSUCCESS(res, "修改菜品类型成功");
                }
            });
        }
    } else {
        return returnFAIL(res, "请选择要修改的菜品类型");
    }
});

/**
 * 批量删除菜品类型
 * @param ids : 菜品类型ID
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: "删除菜品类型成功"}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/delete', function (req, res) {
    var id = req.body._id.trim();
    if(id){
        dishesType.updateDishesType({_id: id},{$set: {isDel: true, isUpload:false}}, function (error, doc) {
            if (error) {  //如果有错误，则输出错误信息
                returnFAIL(res, error.message);
            }else{
                syncData.syncDishesType(doc._id);
                dishes.update({typeId: doc._id}, {$set: {isDel: true, isUpload: false}}, function (err) {
                    if(!err){
                        syncData.syncDishes();
                    }
                });
                returnSUCCESS(res, "删除菜品类型成功");
            }
        });
    } else {
        return returnFAIL(res, "请选择删除的菜品类型");
    }
});


module.exports = router;