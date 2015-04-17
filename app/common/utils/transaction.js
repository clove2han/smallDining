/**
 * 2014/11/27
 * @module 事务的处理
 * @description  目前只有修改的事务可以处理，以后有时间再把添加和删除的加上
 * @author 黄耀奎
 * @modified By
 */
var transaction = require(PROXY).transaction;
var diningMember = require(PROXY).diningMember;
var rechargeLog = require(PROXY).rechargeLog;
var dishesOrder = require(PROXY).dishesOrder;
var dishes = require(PROXY).dishes;
var restOrders = require(PROXY).restOrders;
var consumerLog = require(PROXY).consumerLog;
var table = require(PROXY).table;
var tool = require(BASEDIR + '/app/common/utils/tool');

var async = require('async');

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

/**
 * @param fromCollection 集合名称
 * @param content   原数据内容必须是对象，不能是数据
 * @param superior  上一条数据有关联的事务ID
 *
 * 事务四种状态,initial, pending,done,canceled
 */

function transactionData(fromCollection, content, superior, state, transactionId) {

    if(tool.isArray(content)){
        var contents = content[0];
    }else{
        var contents = content;
    }

    return {
        fromCollection : fromCollection,                           //所更改的集合
        content :  contents,                                        //更改新的记录
        superior : superior || "",                                 //与上一条数据有关联的事务Id
        state : state || "",                                       //当前状态
        transactionId : transactionId || "",                       //当前事务的ID
        oneId : "",
        _init: function (callback) {
            var self = this;
            var newData = {
                fromCollection: self.fromCollection,
                content: self.content,
                superior: self.superior,
                state: "initial"
            };

            async.series([
                function(cb) {
                    proxyObj.transaction.createOneTransaction(newData, function (err, doc) {
                        if (!err) {
                            self.state = "initial";
                            self.transactionId = doc._id;
                        }
                        cb(err)
                    });
                },
                function(cb) {
                    if(self.superior){

                        var condition = {_id: self.superior};
                        var update = {$set: {state: "done"}};

                        proxyObj.transaction.update(condition, update, function (err, doc) {
                            cb(err);
                        });
                    }else{
                        cb(null)
                    }
                }
            ], function(err) {
                callback(err);
            });


        },
    _pending : function (callback) {

        var self = this;

        var condition = {_id: self.transactionId};
        var update = {$set: {state: "pending"}};

        proxyObj.transaction.update(condition, update, function (err, doc) {
            if (!err) {
                self.state = "pending"
            }
            callback(err);
        })
    },
    _done: function (callback) {

        var self = this;
        var condition = {_id: self.transactionId};
        var update = {$set: {state: "done"}};

        proxyObj.transaction.update(condition, update, function (err) {
            callback(err);
        });
    },
    _canceled : function (callback) {
        var self = this;
        console.log('事务回滚');
        self.oneId = self.transactionId;    //回滚前把最底层的Id保存起来，用于最后进行状态更改

        Rollbacks(self, callback)
    }
    };

}



function Rollbacks(self, callback){
    var condition = {};
    var update = {};
    var error = {};
    switch (self.state) {
        case "initial":
            console.log('状态是');
            console.log('initial');
            //当为initial时代表数据没有修改或数据已经还原

            if (self.superior) {
                console.log('状态是initial,但有superior上一级'+self.superior);

                proxyObj.transaction.getTransactionByQuery({_id: self.superior}, function (err, doc) {
                    if (err) {
                        error = err;
                    } else {
                        self.fromCollection = doc[0].fromCollection;
                        self.content = doc[0].content;
                        self.superior = doc[0].superior || "";
                        self.state = doc[0].state;
                        self.transactionId = doc[0]._id;
                        Rollbacks(self, callback);
                    }
                })

            } else {
                console.log('状态是initial,但没有superior上一级'+self.superior);
                condition = {_id: self.content._id, pendingTransactions:{$nin:[String(self.transactionId)]}};
                update = {'$set': self.content, '$push':{pendingTransactions: self.transactionId}};
                proxyObj[self.fromCollection].update(condition, update, function (err, doc) {
                    if(err){
                        error = err;
                    }else{
                        condition = {_id: self.transactionId};
                        update = {$set: {state: "canceled"}};
                        proxyObj.transaction.update(condition,update, function (err) {
                            error = err;
                        });
                    }
                });
            }

            break;
        case "pending":
            //当为pending时，代表已经修改原数据，但下面的步骤已经死掉
            //一层层回滚
            console.log('状态是');
            console.log('pending');
                async.series([
                    function (cb) {
                        //防止重复还原数据
                        condition = {_id: self.content._id, pendingTransactions:{$nin:[String(self.transactionId)]}};

                        var updateObj = {};

                        if(tool.hasToJson(self.content)){
                            updateObj = self.content.toJSON();
                        }else{
                            updateObj = self.content;
                        }
                        update = {'$set': updateObj, '$push':{pendingTransactions: self.transactionId}};

                        console.log(update);

                        proxyObj[self.fromCollection].update(condition, update, function (err, doc) {
                            cb(err);
                        });
                    },
                    function (cb) {
                        //还原成功
                        proxyObj.transaction.update({_id: self.transactionId}, {$set:{state: "canceled"}}, function (err, doc) {
                            cb(err)
                        })
                    },
                    function (cb) {
                        self.state = "canceled";
                        //有上一层数据改动，进行上一层还原
                        if (self.superior) {
                            console.log('状态是pending,但有superior上一级'+self.superior);
                            proxyObj.transaction.getTransactionByQuery({_id: self.superior}, function (err, doc) {
                                if (err) {
                                    cb(err)
                                } else {
                                    self.fromCollection = doc[0].fromCollection;
                                    self.content = doc[0].content;
                                    self.superior = doc[0].superior || "";
                                    self.state = doc[0].state;
                                    self.transactionId = doc[0]._id;
                                    Rollbacks(self, callback);
                                }
                            })
                        } else {
                            console.log('状态是pending,但没有superior上一级'+self.superior);

                            Rollbacks(self, callback);
                        }
                        cb(null)
                    }
                ], function (err) {
                    if (err) {
                        error = err;
                    }
                });

            break;
        case "done":
            async.series([
                function (cb) {
                    //防止重复还原数据
                    condition = {_id: self.content._id, pendingTransactions:{$nin:[String(self.transactionId)]}};
                    update = {'$set': self.content, '$push':{pendingTransactions: self.transactionId}};

                    proxyObj[self.fromCollection].update(condition, update, function (err, doc) {
                        console.log(err);
                        cb(err);
                    });
                },
                function (cb) {
                    //还原成功
                    proxyObj.transaction.update({_id: self.transactionId}, {$set:{state: "canceled"}}, function (err, doc) {
                        cb(err)
                    })
                },
                function (cb) {
                    //有上一层数据改动，进行上一层还原
                    if (self.superior) {
                        console.log('状态是done,但有superior上一级'+self.superior);

                        proxyObj.transaction.getTransactionByQuery({_id: self.superior}, function (err, doc) {
                            if (err) {
                                cb(err)
                            } else {
                                self.fromCollection = doc[0].fromCollection;
                                self.content = doc[0].content;
                                self.superior = doc[0].superior || "";
                                self.state = doc[0].state;
                                self.transactionId = doc[0]._id;
                                Rollbacks(self, callback);
                            }
                        })
                    } else {
                        console.log('状态是done,但没有superior上一级'+self.superior);
                        console.log('把最底层的Id拿出来还原数据');
                        proxyObj.transaction.getTransactionByQuery({_id: self.oneId}, function (err, doc) {
                            if (err) {
                                cb(err)
                            } else {
                                resetParam(self, doc, true);
                                Rollbacks(self, callback);
                            }
                        })
                    }
                    cb(null)
                }
            ], function (err) {
                if (err) {
                    error = err;
                }
            });
            break;

    }
    callback(error);

}

function resetParam(self, doc, setEmpty){

    self.fromCollection = doc[0].fromCollection;
    self.content = doc[0].content;
    self.state = doc[0].state;
    self.transactionId = doc[0]._id;
    if(setEmpty){
        self.superior = "";
    }else{
        self.superior = doc[0].superior || "";
    }
}

module.exports = transactionData;