/**
 * @module controllers/dishes
 * @description 菜品信息的路由
 * @author 冀玉鑫
 * @modified By 黄耀奎
 */
var router = require('express').Router();
var dishes = require(PROXY).dishes;
var async = require('async');
var fs = require('fs');
var validator = require('validator');
var path = require("path");
var _ = require('underscore');
var tool = require(BASEDIR + '/app/common/utils/tool');
var syncData = require(BASEDIR+ '/app/common/utils/syncData');

/**
 * 根据条件查询菜品(分页）
 * @param id : 菜品ID
 * @param name : 菜品名称
 * @param typeId : 菜品类型ID
 * @param page : 当前第几页
 * @param pageSize : 每页显示多少行
 */
router.post('/page', function (req, res) {
    var params = req.body;

    //定义查询条件
    var query = {};
    if (params._id) {
        query['_id'] = params._id;
    }
    if (params.name) {
        query['name'] = params.name;
    }
    if (params.typeId) {
        query['typeId'] = params.typeId;
    }
    if (params.activityType) {
        query['activityType'] = params.activityType;
    }
    query.isDel = false;
    //查询总数（amount：总数量）
    dishes.getDishesCount(query, function (error, amount) {
        if (error) {  //如果有错误，则输出错误信息
            return returnFAIL(res, error.message);

        } else {
            var page = params.page ? params.page : 1;   //当前的页数
            var pageSize = params.pageSize;           //每页的记录数

            var opt = {};
            if (page && pageSize) {
                opt['skip'] = parseInt((page - 1) * pageSize);
                opt['limit'] = parseInt(pageSize);
            }
            //查询分页数据
            dishes.getDishesByPage(query, opt, function (error, dishes) {
                if (error) {  //如果有错误，则输出错误信息

                    return returnFAIL(res, error.message);

                } else { //否则返回菜品信息和分页信息
                    return returnSUCCESS(res, {
                        amount: amount                    //总数
                        , pageCount: Math.floor((amount - 1) / pageSize + 1)  //总共多少页
                        , data: dishes                    //菜品的对象数组
                    });
                }
            });
        }
    });
});

/**
 * 根据条件查询菜品
 * @param id : 菜品ID
 * @param name : 菜品名称
 * @param typeId : 菜品类型ID
 * @param activityType : 菜品活动类型
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: dishes}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/query', function (req, res) {
    var query = deleteNull(validator, req.body);
    if (query.abbr) {
        query.abbr = new RegExp(query.abbr);
    }
    if (query.name) {
        query.name = new RegExp(query.name);
    }

    if(query.supplyTimeId){
        query.supplyTimeId = {$all: query.supplyTimeId}
    }
    query.isDel = false;

    dishes.getDishesByQuery(query, null, function (error, dishes) {
        if (error) {  //如果有错误，则输出错误信息
            return returnFAIL(res, error.message);
        } else { //否则返回全部菜品
            return returnSUCCESS(res, dishes);
        }
    });
});
/**
 * 根据条件查询菜品数量
 * @param id : 菜品ID
 * @param name : 菜品名称
 * @param typeId : 菜品类型ID
 * @param activityType : 菜品活动类型
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: count}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/count', function (req, res) {
    var query = deleteNull(validator, req.body);

    dishes.getDishesCount(query, function (error, count) {
        if (error) {  //如果有错误，则输出错误信息
            return returnFAIL(res, error.message);
        } else { //否则返回菜品数量
            return returnSUCCESS(res, count);
        }
    });
});


/**
 * 新增菜品信息
 * @param {（菜品所有属性）}
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: jellybean._id}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/add', multipartMiddleware, function (req, res) {
    var params = deleteNull(validator, req.body);

    var file = req.files;
    //是否包含图片
    var isHasImg = false, isHasLitImg = false;
    if (!isEmptyObject(file) && file.imgName) {
        if (tool.isImg(file.imgName.originalFilename)) {
            //重命名
            params.imgName = tool.renameImg(file.imgName.originalFilename);
            isHasImg = true;
        } else {
            return returnFAIL(res, "上传的图片格式不正确");
        }
        if (tool.isImg(file.litimg.originalFilename)) {
            //重命名
            var litImgName = params.imgName;
            isHasLitImg = true;
        } else {
            return returnFAIL(res, "上传的缩略图片格式不正确");
        }
    } else {
        return returnFAIL(res, '缺少图片');
    }

    params = formatParams(params);

    //是否套餐
    if(params.packageContent){
        params.isPackage = true;

        if(tool.isJson(params.packageContent)){
            params.packageContent = JSON.parse(params.packageContent);

            if(params.packageContent.length <= 0){
                return returnFAIL(res, "参数错误");
            }

        }else{
            return returnFAIL(res, "参数错误");
        }
    }

    async.auto({
        getDishesInfo: function (cb) {
            //添加前判断是否是之前删除过的菜品，如果是把恢复并修改它
            dishes.getOneDishes({name: params.name, isDel:true}, function (err, dishesData) {
                cb(err, dishesData);
            });
        },
        waitDishesInfo: ['getDishesInfo', function (cb, data) {
            if(tool.isObjectEmpty(data.getDishesInfo)){
                dishes.addDishes(params, function (error, jellybean) {
                    cb(error, jellybean);
                });
            }else{
                params.isDel = false;
                params.isUpload = false;
                var update = {$set: params};

                dishes.updateDishes({_id: data.getDishesInfo._id}, update, function (err, result) {
                    cb(err, result);

                })
            }
        }]
    }, function (err, result) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            params.shopId = tool.getDiningId();
            params._id = String(result.waitDishesInfo._id);

            if (isHasImg) {   //判断是否有图片上传
                //临时文件地址
                var oldFilePath = file.imgName.path;
                //创建用于保存图片的目录
                var newFileDir = path.join(BASEDIR, "/public/images/dishesPicture");
                if (!fs.existsSync(newFileDir)) {
                    fs.mkdirSync(newFileDir);
                }
                //保存图片的绝对地址
                var newFilePath = path.join(newFileDir, params.imgName);

                fs.rename(oldFilePath, newFilePath, function (err) {
                    if (!err) {
                        params.imgName = newFilePath;
                        syncData.syncDishes(result.waitDishesInfo._id);
                        fs.unlink(oldFilePath, function (err) {

                        });
                    }
                });
            }
            if (isHasLitImg) {   //判断是否有图片上传
                //临时文件地址
                var oldLitFilePath = file.litimg.path;
                //创建用于保存图片的目录
                var newLitFileDir = path.join(BASEDIR, "/public/images/dishesLitPicture");
                if (!fs.existsSync(newLitFileDir)) {
                    fs.mkdirSync(newLitFileDir);
                }
                //保存图片的绝对地址
                var newLitFilePath = path.join(newLitFileDir, litImgName);
                //复制文件
                tool.moveAndDel(oldLitFilePath, newLitFilePath);
            }

            return returnSUCCESS(res, result.waitDishesInfo._id);
        }
    });
});


/**
 * 修改菜品信息
 * @param {（菜品所有属性）}
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: "修改菜品成功"}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/update', multipartMiddleware, function (req, res) {
    //接收修改的所有字段及图片
    var query = {}, update = {};
    query._id = _.escape(req.body._id);
    delete req.body._id;
    update = req.body;
    var file = req.files;

    var isHasImg = false, isHasLitImg = false;
    if (!isEmptyObject(file) && file.imgName) {

        if (tool.isImg(file.imgName.originalFilename)) {
            //重命名
            update.imgName = tool.renameImg(file.imgName.originalFilename);
            isHasImg = true;
        } else {
            return returnFAIL(res, "上传的图片格式不正确");
        }
        if (tool.isImg(file.litimg.originalFilename)) {
            //重命名
            var litImgName = update.imgName;
            isHasLitImg = true;
        } else {
            return returnFAIL(res, "上传的缩略图片格式不正确");
        }
    }

    update = formatParams(update);

    //是否套餐
    if(update.packageContent){
        update.isPackage = true;
        if(tool.isJson(update.packageContent)){
            update.packageContent = JSON.parse(update.packageContent);
        }else{
            return returnFAIL(res, "参数错误");
        }
    }

    dishes.getDishesByQuery(query, {}, function (err, result) {

        if (err) {
            return returnFAIL(res, err.message);
        } else {
                dishes.getDishesByQuery({name: update.name, _id: {$ne: query._id}}, {}, function (err, data) {


                    if (data.length > 0) {
                        return returnFAIL(res, '菜品名称已在在');
                    } else {
                        update.isUpload = false;
                        dishes.updateDishes(query, {$set: update}, function (err, data) {

                            if (err) {
                                return returnFAIL(res, err.message);
                            } else {
                                if (isHasImg) {   //判断是否有图片上传
                                    //临时文件地址
                                    var oldFilePath = file.imgName.path;
                                    //创建用于保存图片的目录
                                    var newFileDir = path.join(BASEDIR, "/public/images/dishesPicture");
                                    //保存图片的绝对地址
                                    var newFilePath = path.join(newFileDir, update.imgName);
                                    update.imgName = newFilePath;
                                    tool.moveAndDel(oldFilePath, newFilePath);
                                    var localPath = path.join(newFileDir, result[0].imgName);
                                    fs.unlink(localPath, function (err) {
                                        if (err) {
                                            console.log(err.message);
                                        }
                                    });
                                }
                                if (isHasLitImg) {   //判断是否有图片上传

                                    //临时文件地址
                                    var oldLitFilePath = file.litimg.path;
                                    //创建用于保存图片的目录
                                    var newLitFileDir = path.join(BASEDIR, "/public/images/dishesLitPicture");
                                    //保存图片的绝对地址
                                    var newLitFilePath = path.join(newLitFileDir, litImgName);
                                    //复制文件
                                    tool.moveAndDel(oldLitFilePath, newLitFilePath);
                                    var localLitPath = path.join(newLitFileDir, result[0].imgName);
                                    fs.unlink(localLitPath, function (err) {
                                        if (err) {
                                            console.log(err.message);
                                        }
                                    });
                                }
                                syncData.syncDishes(data._id);
                                return returnSUCCESS(res, '修改成功');
                            }
                        });
                    }
                });
        }
    });
});

/**
 * 批量删除菜品
 * @param ids : 菜品ID ( { id: '001, 002'} )
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: "删除菜品成功"}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */

router.post('/delete', function (req, res) {
    var id = req.body._id;
    if (id) {
        //删除的条件
        var query = {
            _id: id
        };

        //删除菜之前，先查找是否有套餐引用这道菜的ID
        async.auto({
            checkDishes: function (cb) {
                var condition = {"packageContent.list": {$in: [id]}};
                dishes.getDishesByQuery(condition, null, function (err, result) {
                    if(result.length > 0){
                        var str = "";
                        result.forEach(function (item) {
                           str += item.name+' ';
                        });

                        cb({message: str + '里还有引用该菜，请先移除套餐里的该菜品'});
                    }else{
                        cb(null);
                    }
                })
            },
            delDishes: ['checkDishes', function (cb) {
                dishes.updateDishes(query, {$set: {isDel: true, isUpload:false}}, function (error, data) {
                    if (error) {  //如果有错误，则输出错误信息
                        cb(error);
                    }else{
                        try{
                            if(!tool.isObjectEmpty(data)){
                                tool.delFile(data.imgName);
                                syncData.syncDishes(data._id);
                            }
                        }catch (e){
                            console.log(e);
                        }
                        cb(null);
                    }
                });
            }]
        }, function (err, results) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                return returnSUCCESS(res, "删除成功");
            }
        });

    } else {
        return returnFAIL(res, "请选择删除的菜品")
    }
});
/**
 * 格式化菜品参数
 * @param params : 菜品参数对象
 */
function formatParams(params) {
    var params = deleteNull(validator, params);
    if (params.sort) params.sort = sortRes.length > 0 ? sortRes[0].sort + 1 : 1;  //排序号
    if (params.flavorId) params.flavorId = params.flavorId.length > 0 ? JSON.parse(params.flavorId) : null; //口味
    if (params.supplyTimeId) params.supplyTimeId = params.supplyTimeId.length > 0 ? JSON.parse(params.supplyTimeId) : null; //按就餐时间划分类型
    if (params.price) params.price = parseFloat(params.price);                      //价格
    if (params.salePrice) params.salePrice = parseFloat(params.salePrice);          //特价
    if (params.state) params.state = parseInt(params.state);                        //状态
    if (params.surplus) params.surplus = parseInt(params.surplus) > 0 ? parseInt(params.surplus) : 0;             //可供数量
    if (params.haveOnNumber) params.haveOnNumber = parseInt(params.haveOnNumber) > 0 ? parseInt(params.haveOnNumber) : 0;             //已点数量

    params.createDate = Date.now();

    return params;
}

module.exports = router;