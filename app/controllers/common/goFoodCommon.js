/**
 * 2015/1/29
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var dishesOrder = require(PROXY).dishesOrder;
var restOrders = require(PROXY).restOrders;

exports.goUpDishesOk = function (orderId, callback) {
    if(orderId){
        //检查属于该订单的所有菜品是否都已经完成(除了套餐),如果是就把ongoing改为false
        var condition = {orderId: orderId, state:{$nin:[4,5]}, isPackage: false};

        dishesOrder.getDishesOrderCount(condition, function (err, total) {
            if(err){
                callback(err);
            }else{
                if(total == 0){
                    //当所有的菜都上完了,把有效的套餐改为完成
                    var query = {orderId: orderId, state:{$nin: [4,5]}, isPackage: true};
                    dishesOrder.getDishesOrderCount(query, function (err, sum) {
                        if(err){
                            callback(err);
                        }else{
                            if(sum > 0){
                                dishesOrder.update(query, {$set: {state: 4, goUpNum: 1, number: 1}}, function (err) {
                                    if(err){
                                        callback(err);
                                    }else{
                                        var condition = {_id: orderId};
                                        var update = {$set: {ongoing: false, isDone: true}};
                                        restOrders.updateRestOrders(condition, update, function (err) {
                                            callback(err);
                                        });
                                    }
                                });
                            }else{
                                var condition = {_id: orderId};
                                var update = {$set: {ongoing: false, isDone: true}};
                                restOrders.updateRestOrders(condition, update, function (err) {
                                    callback(err);
                                });
                            }
                        }
                    });

                }else{
                    callback({message: "还有菜单未完成"});
                }
            }
        });
    }else{
        callback({message: '参数错误'});
    }

};