/**
 * 2015/1/19
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var tran = require(BASEDIR + '/app/common/utils/transaction');
var tool = require(BASEDIR + '/app/common/utils/tool');
var async = require('async');

var transaction = require(PROXY).transaction;
var diningMember = require(PROXY).diningMember;
var rechargeLog = require(PROXY).rechargeLog;
var dishesOrder = require(PROXY).dishesOrder;
var restOrders = require(PROXY).restOrders;
var dishes = require(PROXY).dishes;
var consumerLog = require(PROXY).consumerLog;
var table = require(PROXY).table;

var proxyObj = {
    transaction: transaction,
    diningMember: diningMember,
    rechargeLog: rechargeLog,
    dishesOrder: dishesOrder,
    restOrders: restOrders,
    consumerLog: consumerLog,
    table: table,
    dishes: dishes
};



module.exports = function (array, callback) {
    //[{collection:{}, query:{}, update{}},...]
    var t = {};
    var superiorId = "";
    var FuncArray = [];
    if(tool.isArray(array)){
        array.forEach(function (obj) {
            FuncArray.push(function(cb) {
                    //查出原数据，事务进行保存
                    proxyObj[obj.collection].queryOneData(obj.query, function(err, doc){
                        if(err){
                            console.log(err);
                            cb(err);
                        }else{
                            t = new tran(obj.collection, doc, superiorId);
                            //保存成功把上一级事务Id赋值给全局的superiorId,如果上一级superiorId不为""自动把事务状态改为done
                            t._init(function(err){
                                if(err){
                                    console.log(err);

                                    cb(err);
                                }else{
                                    superiorId = t.transactionId;
                                    cb(null);
                                }
                            })
                        }
                    });
                },
                function(cb) {
                    //进行数据修改
                    proxyObj[obj.collection].update(obj.query, obj.update, function(err, doc){
                        if(err){
                            console.log(err);

                            cb(err)
                        }else{
                            //修改成功，把事务的状态更改
                            t._pending(function(err){
                                if(err){
                                    cb(err)
                                }else{
                                    cb(null)
                                }
                            })
                        }
                    });
                })

        });

            async.series(FuncArray, function(err) {
                if(err){
                    t._canceled(function (err) {
                        if(err){
                            console.log(err);

                            callback(err);
                        }else{
                            callback({message: "操作失败"})
                        }
                    });
                }else{
                    t._done(function(err){
                        if(err){
                            console.log(err);

                            callback(err);
                        }else{
                            callback(null, "操作成功");
                        }
                    })
                }
            });
    }else{
        callback({message: "不是数组"});
    }
};

/*
使用方法
var arrayData = [
    {
        collection:"diningMember",
        query:{_id: '548e89c147fa20781edc8f08'},
        update:{$inc: {prepayments: -100}}
    },
    {
        collection:"diningMember",
        query:{_id: '545dd5dba08afd6c3a4b3f45'},
        update:{$inc: {prepayments: 100}}
    }
];


tran(arrayData, function(err){
    if(err){
        console.log(err);
    }else{
        console.log('ok');
    }
});*/
