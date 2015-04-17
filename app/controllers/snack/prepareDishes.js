/**
 * 2015/1/20
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var validator = require('validator');
var tool = require(BASEDIR + '/app/common/utils/tool');
var dishes = require(PROXY).dishes;
var saveSocket = require(CONTROLLERS + '/common/saveSocket');

router.post('/saveSocketId', function (req, res) {
    saveSocket.savePrepare(req.body, function (err) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, "保存成功");
        }
    });
});

/**
 * 根据条件获取所有的菜（除了套餐）
 */
router.post('/getDishes', function (req, res) {
    var params = tool.deleteNull(validator, req.body);
    var query = {isPackage: {$ne: true}};

    if(params.typeId){
        query.typeId = {$in: params.typeId.split(',')};
    }

    if(params.supplyTimeId){
        query.supplyTimeId = {$all: params.supplyTimeId}
    }

    dishes.getDishesByQuery(query, null, function (error, dishes) {
        if (error) {  //如果有错误，则输出错误信息
            return returnFAIL(res, error.message);
        } else { //否则返回全部菜品
            return returnSUCCESS(res, dishes);
        }
    });

});


/**
 * 操作库存
 */
router.post('/addSurplus', function (req, res) {
    var data = tool.deleteNull(validator, req.body);
    var condition = {}, update = {};
    if (data._id && data.isAdd) {
        condition._id = data._id;

        if (data.isAdd == 'true') {
            update = {$inc: {surplus: 1}};
        } else {
            update = {$inc: {surplus: -1}};
        }

        dishes.updateDishes(condition, update, function (err, doc) {
            if (err) {
                return returnFAIL(res, err.message);
            } else {
                var data = {
                    _id: doc._id,
                    surplus: doc.surplus
                };

                for(var i in SOCKETS.cashier){
                    SOCKETIO.sockets.socket(SOCKETS.cashier[i].cashierSocketId).emit('surplusChange',data);
                }
                for(var j in SOCKETS.kitchen){
                    SOCKETIO.sockets.socket(SOCKETS.kitchen[j].kitchenSocketId).emit('surplusChange',data);
                }
                return returnSUCCESS(res, '操作成功');
            }
        });
    } else {
        return returnFAIL(res, "缺少参数");
    }
});

module.exports = router;