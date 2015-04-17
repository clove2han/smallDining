/**
 * @module       controllers/table
 * @description
 * @author 韩皎
 * @modified By 黄耀奎
 */
var router = require('express').Router();
var table = require(PROXY).table;
var validator = require('validator');
var _ = require('underscore');
var tool = require(BASEDIR + '/app/common/utils/tool');
var push = require(BASEDIR + '/app/common/utils/push');
var syncData=require(BASEDIR+'/app/common/utils/syncData');
/**
 * 根据条件查询台位  (当条件为空时，查询所有的台位)
 * @param name : 台位名称
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', result: table}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/query' , function (req, res) {
    var query = {};
    //定义查询条件
    query = deleteNull(validator, req.body);

    if(query && query.name){
        query.name = new RegExp(query.name);
    }
    query.isDel = false;
    table.getTableByQuery(query, {}, function(err, tables){
        console.log(err);
        if(err){  //如果有错误，则输出错误信息
            return returnFAIL(res, err.message);

        }else{ //否则返回全部台位
            return returnSUCCESS(res, tables);
        }
    },{});
});

/**
 * 新增台位信息
 * @param {（台位所有属性）}
 * return
 *  SUCCESS : {resultCode: 'SUCCESS', "新增台位成功"}
 *  FAIL    : {resultCode: 'FAIL', result: error.message}
 */
router.post('/add' , function (req, res) {
    //获取网页元素
    var params = deleteNull(validator,req.body);
    table.addTable(params, function(err, data){
        if(err){  //如果有错误，则输出错误信息
            return returnFAIL(res, err.message);
        }else{
            /*推送
             }（新增/修改）：/server/merchant/tableType/push
             {
             _id : ID
             shopId : 店铺ID
             name : 名称
             sort   :params.sort,                  //显示顺序
             number :params.number,                //可坐人数
             state  :params.state,                 //状态
             sendPrice: params.sendPrice           //预订起订价格
             }*/
            var smallUrl = "/server/merchant/table/push";
            var smallData = {
                _id            : String(data._id),//ID
                shopId         : tool.getDiningId(),//店铺ID
                name           : data.name,//台位名称
                tableTypeId    : String(data.tableTypeId),//台位类型ID
                orderId        : "",//临时订单号
                sort           : data.sort,//显示顺序
                state          : data.state,//台位状态
                mealsNumber    : data.mealsNumber,//目前就餐人数
                openDate       : "",//开台时间
                remark         : ""//备注
            };
            push.normalPushToSmall(smallUrl, smallData, function (err, result_small){

                if(!err){
                    if (JSON.parse(result_small).ResultCode == "SUCCESS") {
                        table.updateTable({_id:data._id}, {$set: {isUpload: true}}, function(err){
                            console.log(err);
                        });
                    }
                }

            });
            return returnSUCCESS(res, "新增台位成功");
        }
    });

});

/**
 * 修改台位信息
 * @param {（台位所有属性）}
 * return
 *  SUCCESS : {flag: true, message: "修改台位成功"}
 *  FAIL    : {flag: false, message: err.message}
 */
router.post('/update' , function (req, res) {
    var query = {};
    var update = deleteNull(validator,req.body);
    query._id = update._id;
    delete update._id;

    table.getTableByQuery({name: update.name, _id: {$ne:query._id}}, function (err, data) {
        if(err){
            return returnFAIL(res, err.message)
        } else {
            if(data.length > 0){
                return returnFAIL(res, '台位名称重复');
            }else{
                update.isUpload = false;
                table.updateTable(query, {$set:update}, function (err,data) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }else{
                        var smallUrl = "/server/merchant/table/push";
                        var smallData = {
                            _id            : String(data._id),//ID
                            shopId         : tool.getDiningId(),//店铺ID
                            name           : data.name,//台位名称
                            tableTypeId    : String(data.tableTypeId),//台位类型ID
                            orderId        : "",//临时订单号
                            sort           : data.sort,//显示顺序
                            state          : data.state,//台位状态
                            mealsNumber    : data.mealsNumber,//目前就餐人数
                            openDate       : "",//开台时间
                            remark         : ""//备注
                        };
                        push.normalPushToSmall(smallUrl, smallData, function (err, result_small){
                            if(!err){
                                if (JSON.parse(result_small).ResultCode == "SUCCESS") {
                                    table.updateTable({_id:data._id}, {$set: {isUpload: true}}, function(err){
                                        console.log(err);
                                    });
                                }
                            }

                        });
                        return returnSUCCESS(res, '修改成功');
                    }
                });
            }
        }
    });
});


/**
 * 删除台位
 * @param name : 台位名称
 * return
 *  SUCCESS : {flag: true, message: "删除台位成功"}
 *  FAIL    : {flag: false, message: error.message}
 *  */
router.post('/delete' , function (req, res) {
    var query = {};

    if(req.body._id){
        query._id = _.escape(req.body._id);
    }else{
        return returnFAIL(res, '请选择要删除的台位');
    }

    table.updateTable(query, {$set: {isDel: true, isUpload:false}},function (error) {
        if (error) {  //如果有错误，则输出错误信息
            return returnFAIL(res, error.message);
        }else{
            /*/server/merchant/table/remove
            {
                _id : ""
            }*/
            var smallUrl = "/server/merchant/table/remove";
            var smallData = {
                _id: query._id,
                shopId: tool.getDiningId()
            };
            push.normalPushToSmall(smallUrl, smallData, function (err, result_small){
                if(!err){
                    if (JSON.parse(result_small).ResultCode == "SUCCESS") {
                        table.updateTable(query, {$set: {isUpload: true}}, function(err){
                            console.log(err);
                        });
                    }
                }

            });
            return returnSUCCESS(res, '删除成功');
        }
    });

});

module.exports = router;