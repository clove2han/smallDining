/**
 * 2015/2/11
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var async = require('async'),
    tran = require(BASEDIR + '/app/common/utils/transaction'),
    transaction = require(PROXY).transaction;


/**
 * 回滚所有
 */
exports.all = function () {

    console.log('回滚所有未完成事务');

    transaction.getTransactionByQuery({state:{$nin:["done","canceled"]}}, function (err, docs) {
        if(err){
            console.log(err);
        }else{
            if(docs.length > 0){
                docs.forEach(function(item){
                    var t = new tran(item.fromCollection, item.content, item.superior, item.state, item._id);
                    t._canceled(function (err, result) {
                        if(err){
                            console.log(err);
                        }
                    })
                })
            }
        }
    });
};
