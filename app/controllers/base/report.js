/**
 * 2014/12/11
 * @module 报表
 * @description
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var staff = require(PROXY).staff;
var utils = require('utility');
var _ = require('underscore');
var moment = require('moment');
var validator = require('validator');
var restOrders = require(PROXY).restOrders;
var dishesOrder = require(PROXY).dishesOrder;
var tool = require(BASEDIR + '/tools/tool');
var async = require('async');
var rechargeLog = require(PROXY).rechargeLog;
var consumerLog = require(BASEDIR + '/app/proxy/consumerLog');
var cancelMemberLog = require(BASEDIR + '/app/proxy/cancelMemberLog');
var alternateLog = require(BASEDIR + '/app/proxy/alternateLog');
var diningMember=require(BASEDIR +'/app/proxy/diningMember');


/**
 * 交接班接口
 * @param _id {string} 收银员唯一id
 *
 * */
router.post('/alternate', function (req, res) {
    var totalPrice = 0
        ,discountPrice = 0
        ,count = 0
        ,finishNum = 0
        ,unFinishNum = 0
        ,query = {}
        ,content = {};

    var sumObj = {
        memberPay: 0
        ,cashPay: 0
        ,posPay: 0
        ,beautifyPay:0 //美餐支付
        ,memberRecharge: 0
        ,beautifyBack:0   //美餐退款金额
        ,couponPay: 0
        ,memberCancelPay: 0
        ,memberCashRecharge: 0
        ,memberCUPRecharge: 0
    };

    var backPrice = {memberBackPrice: 0, cashBackPrice: 0,beautifyBack:0};
    //是否可以交接状态，如果是没交接的可以交接
    var id = req.body._id;
    var pattern = parseInt(req.body.pattern);
    if (!pattern) {
        return returnFAIL(res, "参数错误");
    }

    if(id){
        var query = {_id: id, isAlternate: false,isDel:false};
    }else{
        return returnFAIL(res, "缺少数据");
    }

    staff.getStaffByQuery(query, function (err, staffs) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            if(staffs.length > 0 && (_.indexOf(staffs[0].role.permissionList, 4) != -1)){

                var start = staffs[0].loginDate;
                var end = moment().local()._d;
                async.auto({
                    getRestOrders: function (callback) {
                        var condition = {createDate: {$gte: start, $lt: end}};
                        condition["cashier.cashierId"] = id;
                        condition.pattern = pattern;
                        restOrders.groupByCondition(condition, function (err, docs) {
                            callback(err, docs);

                        });
                    },
                    getRestOrderByBack: function (callback) {
                        var condition = {createDate: {$gte: start, $lt: end}};
                        condition["refund.staffCardId"] = id;
                        condition.pattern = pattern;
                        restOrders.groupByCondition(condition, function (err, docs) {
                            callback(err, docs);

                        });
                    },
                    getRechargeLog: function (callback) {
                        var query = {
                            datetime: {$gte: start, $lt:end},
                            operator: id
                        };

                        rechargeLog.queryRechargeLog(query, function (err, rechargeLogData) {
                            callback(err, rechargeLogData);
                        })

                    },
                    getCancelMemberLog: function (callback) {
                        var query = {
                            datetime: {$gte: start, $lt:end},
                            operator: id
                        };
                        cancelMemberLog.getCancelMemberLogByQuery(query, function (err, cancelMemberLog) {
                            callback(err, cancelMemberLog);
                        })

                    },
                    mergeData: ['getRestOrders','getRestOrderByBack', 'getRechargeLog',
                        'getCancelMemberLog', function(callback, AllData) {
                        var restOrdersData = AllData.getRestOrders;
                        var restOrdersBackData = AllData.getRestOrderByBack;
                        var rechargeLogData = AllData.getRechargeLog;
                        var memberCancelPay = AllData.getCancelMemberLog;

                        if(restOrdersData.length > 0){
                            count = restOrdersData.length;
                            restOrdersData.forEach(function (item) {
                                if(item.isDone){
                                    finishNum += 1;
                                }else{
                                    unFinishNum += 1;
                                }
                                totalPrice += item.totalPrice;
                                discountPrice += item.discountPrice;
                                countPrice(item.payment, sumObj);
                            });
                        }
                        if(restOrdersBackData.length > 0){
                            restOrdersBackData.forEach(function (item) {
                                refundCunt(item.refund, backPrice,id);
                            });
                        }

                        if(rechargeLogData.length > 0){
                            rechargeLogData.forEach(function (item) {
                                if(item.mode == 1){
                                    sumObj.memberCashRecharge += item.amount;

                                }else if(item.mode == 2){
                                    sumObj.memberCUPRecharge += item.amount;
                                }
                            });
                        }

                        if(memberCancelPay.length > 0){
                            memberCancelPay.forEach(function (item) {
                                sumObj.memberCancelPay += item.consumer;
                            });
                        }
                        content = {
                            discountPrice: tool.toDecimal1(discountPrice)                   //折扣金额
                            , memberCashRecharge: tool.toDecimal1(sumObj.memberCashRecharge)//会员现金充值金额
                            , memberCUPRecharge: tool.toDecimal1(sumObj.memberCUPRecharge)  //会员银联充值金额
                            , memberBackPrice: tool.toDecimal1(backPrice.memberBackPrice)   //会员退款金额
                            , memberPay: tool.toDecimal1(sumObj.memberPay)                  //会员支付金额
                            , memberCancelPay: tool.toDecimal1(sumObj.memberCancelPay)      //会员退卡金额
                            , cashPay: tool.toDecimal1(sumObj.cashPay)                      //现金支付金额
                            , posPay: tool.toDecimal1(sumObj.posPay)                        //pos支付金额
                            ,beautifyPay:tool.toDecimal1Two(sumObj.beautifyPay)             //美餐支付金额
                            , count: count                                                  //总单数
                            , finishNum: finishNum                                              //已完成单数
                            , unFinishNum: unFinishNum                                            //未完成单数
                            , totalPrice: tool.toDecimal1(totalPrice)                       //原总金额
                            , cashBackPrice: tool.toDecimal1(backPrice.cashBackPrice)       //现金退款金额
                            ,beautifyBackPrice:tool.toDecimal1Two(backPrice.beautifyBack)   //美餐退款总金额
                            , couponPay: tool.toDecimal1(sumObj.couponPay)                  //优惠券使用金额
                            , couponPrice: tool.toDecimal1(totalPrice-discountPrice)        //优惠了多少钱
                            , realPrice: tool.toDecimal1(sumObj.cashPay+sumObj.memberCashRecharge-backPrice.cashBackPrice-sumObj.memberCancelPay)
                            , startDate: moment(staffs[0].loginDate).format('YYYY-MM-DD HH:mm:ss')
                            , alternateDate: moment().format('YYYY-MM-DD HH:mm:ss')
                            , cashier: staffs[0].userName
                            , operator: staffs[0]._id
                        };
                        return returnSUCCESS(res, content);
                    }]
                }, function(err) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }
                });
            }else{
                return returnFAIL(res, "交接错误");
            }
        }

    });
});
/**
 * 客户端打印后执行的方法
 * */
router.post('/startAlternate', function (req, res) {
    var id = req.body._id;

    if(id){
        var query = {_id: id, isAlternate: false};
    }else{
        return returnFAIL(res, "缺少数据");
    }

    staff.updateStaff(query, {$set: {isAlternate: true}}, function (err, staffData) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            if(tool.isObjectEmpty(staffData)){
                return returnFAIL(res, "状态不正常");
            }else{
                SOCKETIO.sockets.emit('cashierOut', {_id: staffData._id, name: staffData.name, position: staffData.position});
                return returnSUCCESS(res, "交接成功");
            }

        }

    });
});
//退款方式(1:现金，2: 支付宝, 3: 微信， 4: 银联，5: 优惠 6:会员卡)
function refundCunt(refund, backPrice,id){
    if(refund && refund.length > 0){
        refund.forEach(function (item) {
            if(String(item.staffCardId)==String(id)){
                if(item.paymentMethod == 1){
                    backPrice.cashBackPrice += item.price;

                }else if(item.paymentMethod == 6){
                    backPrice.memberBackPrice += item.price;

                }else if(item.paymentMethod==9){
                    backPrice.beautifyBack+=item.price;
                }

            }
        })
    }
}


/**
 * 请求参数 startTime cashierId  endTime
 * 返回内容 content
 */
//查询店铺的营业报表
router.post('/reportQuery',function(req,res){
    var totalPrice = 0
        ,discountPrice = 0  //打折价格
        ,count = 0   //总单数
        ,cancelMemberPrice=0   //会员退卡金额
        ,cancelGiveMoney=0
        ,query = {}
        ,useGiveMon=0  //消费的赠送积分总和
        ,nowGiveMon=0  //会员剩余赠送金额总和
        ,queryTime = {}
        ,prepayments=0   //会员记录表中的预付款
        ,content = {};  //返回的内容
    var sumObj = {
        memberPay: 0
        ,cashPay: 0
        ,posPay: 0
        ,beautifyPay:0  //美餐支付
        ,memberRecharge: 0
        ,couponPay:0
        //新增
        ,allPerson:0        //总人数
        ,avePrice : 0       //人均消费
        ,cashPayLength:0    //现金交付次数
        ,posPayLength:0     //刷卡次数
        ,memberPayLength:0  //会员消费次数
        ,cashBack:0         //现金退款金额
        ,cashBackLength:0   //现金退款金额的次数
        ,memberBack:0        //会员退款
        ,memberBackLength:0 //会员退款金额次数
        ,posBack:0          //银联卡退款
        ,posBackLength:0 //银联卡退款次数
        ,beautifyBack:0   //美餐退款金额
        ,beautifyBackLength:0  //美餐退款次数
        ,sumRechGiveMon:0 //总充值赠送金额
        ,cashRecharge:0  //会员现金充值金额
        ,posRecharge:0  //会员银联充值金额
        ,backRecharge:0 //会员退款金额

    };

    var backPrice = {backPrice: 0};
    var params = req.body;
    console.log(params);
    if(params.pattern){
        query.pattern=params.pattern;
    }

    if(params.startTime){
        queryTime.$gte = moment(String(params.startTime))._i;
        delete params.startTime;
    }

    if(params.endTime){
        queryTime.$lte = moment(String(params.endTime))._i;
        delete params.endTime;
    }

    if(params.cashierId){
        query["cashier.cashierId"]=params.cashierId
    }

    query.isDel=false;        //订单未删除
    query.orderState=1;       //订单已支付
    query.createDate = queryTime;
    async.auto({
        getRestOrders: function (callback) {
            restOrders.groupByCondition(query, function (err, docs) {
                callback(err, docs);
            });
        },
        getRechargeLog: function (callback) {
            rechargeLog.queryRechargeLog({datetime:queryTime}, function (err, rechargeLogData) {
                callback(err, rechargeLogData);
            })
        },
        getCancelMemberLog:function(callback){
            var condition = {
                datetime: queryTime
            };
            cancelMemberLog.getCancelMemberLogByQuery(condition, function (err, cancelMemberLog) {
                callback(err, cancelMemberLog);
            })
        },
        getConsumerLog:function(callback){
            consumerLog.getConsumerLogByQuery({datetime:queryTime},function(err,consumerLogData){
                callback(err, consumerLogData);
            })
        },
        getNowGiveMoney:function(callback){
            diningMember.getMemberByQuery({isDel:false,state:0},{},function(err,nowGiveMoneyData){
                callback(err,nowGiveMoneyData);
            })
        },
        mergeData: ['getRestOrders', 'getRechargeLog','getCancelMemberLog','getConsumerLog','getNowGiveMoney', function(callback, AllData) {
            var restOrdersData = AllData.getRestOrders;
            var rechargeLogData = AllData.getRechargeLog;
            var cancelMemberLog=AllData.getCancelMemberLog;
            var consumerLogData=AllData.getConsumerLog;
            var nowGiveMoneyData=AllData.getNowGiveMoney;

            if(restOrdersData.length > 0){
                count = restOrdersData.length;
                restOrdersData.forEach(function (item) {
                    totalPrice += item.totalPrice;
                    sumObj.allPerson+=item.foundingInfo.mealsNumber;
                    discountPrice += item.discountPrice;
                    dealRestOrder(item.refund, backPrice,sumObj);
                    countPrice(item.payment, sumObj);
                });
            }

            if(rechargeLogData.length > 0){
                rechargeLogData.forEach(function (item) {
                    sumObj.memberRecharge += item.amount;
                    switch (item.mode){
                        case 1:
                            sumObj.cashRecharge += item.amount;
                            sumObj.sumRechGiveMon+=item.giveMoney;
                            break;
                        case 2:
                            sumObj.posRecharge+=item.amount;
                            sumObj.sumRechGiveMon+=item.giveMoney;
                        //case 3:
                        //    sumObj.backRecharge+=item.amount;
                    }
                });
            };
            if(cancelMemberLog.length>0){
                cancelMemberLog.forEach(function (item) {
                    cancelMemberPrice+=item.consumer;
                    cancelGiveMoney+=item.giveMoney;

                })
            };
            if(consumerLogData.length>0){
                consumerLogData.forEach(function(item){
                    useGiveMon+=item.giveMoney
                })
            };
            if(nowGiveMoneyData.length>0){
                nowGiveMoneyData.forEach(function(item){
                    nowGiveMon+=item.giveMoney;
                    prepayments+=item.prepayments;

                })
            };
            content = {
                 discountPrice: tool.toDecimal1Two(totalPrice-discountPrice)//折扣金额
                , posPay: tool.toDecimal1Two(sumObj.posPay)                //pos支付金额
                , count: count                                          //总单数
                , allPerson:tool.toDecimal1Two(sumObj.allPerson)           //总人数
                , memberPay: tool.toDecimal1Two(sumObj.memberPay)          //会员支付金额
                , cashPay: tool.toDecimal1Two(sumObj.cashPay)              //现金支付金额
                ,beautifyPay:tool.toDecimal1Two(sumObj.beautifyPay)         //美餐支付
                , totalPrice: tool.toDecimal1Two(discountPrice)            //折扣后总金额
                , memberAllRecharge: tool.toDecimal1Two(sumObj.cashRecharge + sumObj.posRecharge)  //充值总金额
                , avePrice :tool.toDecimal1Two(totalPrice/sumObj.allPerson)//人均消费
                , cashPayLength :tool.toDecimal1Two(sumObj.cashPayLength)  //现金交付次数
                , posPayLength :tool.toDecimal1Two(sumObj.posPayLength)    //刷卡次数
                , memberPayLength:tool.toDecimal1Two(sumObj.memberPayLength) //会员消费次数
                , memberRecharge: tool.toDecimal1Two(sumObj.cashRecharge+ sumObj.posRecharge) //会员充值金额
                ,memberAllGiveMoney:tool.toDecimal1Two(sumObj.sumRechGiveMon) //总充值赠送金额
                ,memberCashRecharge:tool.toDecimal1Two(sumObj.cashRecharge)  //会员现金充值金额
                ,memberCUPRecharge:tool.toDecimal1Two(sumObj.posRecharge)    //会员银联充值金额
                ,backPrice: tool.toDecimal1Two(backPrice.backPrice)          //退款总金额
                ,meberTrueCancel:tool.toDecimal1Two(cancelMemberPrice)  //会员现金退卡总金额(不包含赠送金额)
                ,cashBackPrice:tool.toDecimal1Two(sumObj.cashBack)           //现金退款金额
                ,cashBackLength:tool.toDecimal1Two(sumObj.cashBackLength)    //现金退款金额的次数
                ,memberBack:tool.toDecimal1Two(sumObj.memberBack)            //会员退款返回总金额
                ,memberBackLength:tool.toDecimal1Two(sumObj.memberBackLength)//会员退款金额次数
                ,posBack:tool.toDecimal1Two(sumObj.posBack)                  //银联卡退款返回
                ,posBackLength:tool.toDecimal1Two(sumObj.posBackLength)      //银联卡退款次数
                ,beautifyBackPrice:tool.toDecimal1Two(sumObj.beautifyBack)         //美餐退款总金额
                ,couponPay: tool.toDecimal1Two(sumObj.couponPay)             //优惠券使用金额
                ,salexpense :tool.toDecimal1Two(sumObj.sumRechGiveMon+useGiveMon-cancelGiveMoney)       //销售费用  (优惠总金额)
                ,memberAllSurplus: tool.toDecimal1Two(prepayments+nowGiveMon) //会员总余额
                ,yushouMoney:tool.toDecimal1Two(sumObj.posRecharge+sumObj.cashRecharge+sumObj.sumRechGiveMon-sumObj.memberPay+sumObj.memberBack-cancelMemberPrice)
                ,realPrice: tool.toDecimal1Two(sumObj.cashPay-sumObj.cashBack) //现金收款总金额
                ,realMemberPrice:tool.toDecimal1Two(sumObj.memberPay-sumObj.memberBack)  //会员收款总金额
            };
            callback(null);
        }]
    }, function(err) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, content);
        }
    });
});

function countPrice(obj, sumObj) {
    obj.forEach(function (item) {
        switch (item.paymentMethod){
            case 1:
                sumObj.cashPay += item.price;
                sumObj.cashPayLength+=1;
                break;
            case 4:
                sumObj.posPay += item.price;
                sumObj.posPayLength += 1;
                break;
            case 5:
                sumObj.couponPay += item.price;
                break;
            case 6:
                sumObj.memberPay += item.price;
                sumObj.memberPayLength += 1;
                break;
            case 9:
                sumObj.beautifyPay+=item.price;
                break;

        }
    });
}

function dealRestOrder(refund, backPrice,sumObj){
    if(refund && refund.length > 0){
        refund.forEach(function (item) {
            backPrice.backPrice += item.price;
            switch (item.paymentMethod){
                case 1:
                    sumObj.cashBack += item.price;
                    sumObj.cashBackLength+=1;
                    break;
                case 4:
                    sumObj.posBack += item.price;
                    sumObj.posBackLength += 1;
                    break;
                case 6:
                    sumObj.memberBack += item.price;
                    sumObj.memberBackLength += 1;
                    break;
                case 9:
                    sumObj.beautifyBack+=item.price;
                    sumObj.beautifyBackLength+=1;
                    break;
            }
        })
    }
};
//查询店铺的订单列表
router.post('/restOrderList',function(req,res){
    var params=req.body;
    var query={};
    var queryTime={};
    if(params.pattern){
        query.pattern=params.pattern;
    }
    if(params.startTime){
        queryTime.$gte=moment(params.startTime)._i;
        delete params.startTime;
    }
    if(params.endTime){
        queryTime.$lte=moment(params.endTime)._i;
        delete params.endTime;
    }
    if(params.cashierId){
        query["cashier.cashierId"] = params.cashierId

    };
    if(params.orderNumber){
        query.orderNumber=String(params.orderNumber)
    }
    query.createDate=queryTime;
    query.orderState=1;
    query.isDel=false;
    restOrders.getRestOrdersCount(query,function(error,count){
        if(error){
            return returnFAIL(res,error.message);
        }else{
            var page=params.page?params.page:1;  //当前页码
            var pageSize=params.pageSize; //每页的记录数
            var opt ={};
            if(page&&pageSize){
                opt['skip']=parseInt((page-1)*pageSize);
                opt['limit'] =parseInt(pageSize);
            };
            restOrders.getRestOrdersByQuery(query, opt,function (err, docs) {
                if(err){
                    return returnFAIL(res,err.message);
                }else if(docs.length>0){
                    var returnMsg=[];
                    docs.forEach(function(item){
                        var part={
                            _id        : item._id,
                            createDate : String(item.createDate),
                            orderNumber: item.orderNumber,
                            orderType  : item.orderType
                        };
                        part.cashier={
                            name      : item.cashier.name,
                            cashierId : item.cashier.cashierId
                        }
                        returnMsg.push(part);
                    })
                    return returnSUCCESS(res,{
                        amount : count,                                //总数
                        pageCount : Math.floor((count-1)/pageSize+1),  //总共多少页
                        data:returnMsg                               //商铺类型数组
                    });
                } else{
                    return returnFAIL(res,"没有查到订单信息")
                }

             })
        }
    })

});
//查询订单的详情
router.post('/restOrderDetail',function(req,res){
    var params=req.body;
    if(params._id){
        restOrders.getRestOrdersById(params._id,{},function(error,data){
            if(error){
                return returnFAIL(res,error.message);
            }else{
                if(data){
                    return returnSUCCESS(res,data);
                }else{
                    return returnFAIL(res,"没有查到数据");
                }
            }
        })
    }else{
        return returnFAIL(res,"没有指定订单")
    }
});
//菜品销量报表
router.post('/foodSaleRep',function(req,res){
    var params=req.body;
    var queryTime={};
    var query={};
    if(params.pattern){
        query.pattern=params.pattern;
    }
    if(params.startTime){
        queryTime.$gte = moment(params.startTime)._i;
        delete params.startTime;
    }

    if(params.endTime){
        queryTime.$lte = moment(params.endTime)._i;
        delete params.endTime;
    };
    if(params.dishTypeId){
        query.dishTypeId=params.dishTypeId;
    };
    query.createTime=queryTime;
    dishesOrder.getDishesOrderByQuery(query,{},function(error,dishData){
        if(error){
            return returnFAIL(res,error.message);
        }else{
            if(dishData.length>0){
                var returnList=[];
                if(params.startHourNum && params.endHourNum){
                    var dealedData=[];
                    getBetweenTime(params,dishData,dealedData,res);
                    upInfo(dealedData, returnList, res);
                    return returnSUCCESS(res, returnList);
                }else{
                    upInfo(dishData, returnList, res);
                    return returnSUCCESS(res, returnList);
                };

            }else{
                return returnFAIL(res,"没有查到菜品订单数据！")
            }
        }
    })

});
//进行时分段的匹配
function getBetweenTime(params,dishData,oneDealData,res){
    var resu=false;
    dishData.forEach(function(item){
        var hourMin=String(item.createTime).substring(16,21);
        var hourNum=hourMin.replace(':','');
        if(parseInt(hourNum)>parseInt(params.startHourNum)){
            if(parseInt(hourNum)<parseInt(params.endHourNum)){
                oneDealData.push(item);
                resu=true;
            };
        };
    });
    if(oneDealData.length>0){
        return oneDealData;
    }else{
        return returnFAIL(res,"没有数据！")
    }

};
//二次处理菜品销售报表数据
function upInfo(data,returnMsg,res){
    var dishIdList=[];
    data.forEach(function(item){
        if(item.dishesId){
            var dishId=String(item.dishesId);
            var resu=tool.returnIndex(dishId,dishIdList);
            if(resu==-1){
                var itemMsg={
                    dishId:dishId,
                    name:item.name,
                    quantity:item.quantity-item.recedeNum,
                    dishTypeId:item.dishTypeId,
                    recedeNum:item.recedeNum,
                    price:item.price,
                    createTime:moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')
                };
                returnMsg.push(itemMsg);
                dishIdList.push(dishId);
            }else{
                returnMsg.forEach(function(msg){
                    if(msg.dishId==dishId){
                        var que=item.quantity
                        msg.quantity+=(que-item.recedeNum);
                        msg.recedeNum+=item.recedeNum;
                    };
                })
            };
        }else{
            return returnFAIL(res,"菜品订单无菜品Id！")
        };
    })
};
//菜品分类统计
router.post('/foodTypeSta',function(req,res){
    var params=req.body;
    console.log(params)
    var query={};
    var queryTime={};
    if(params.pattern){
        query.pattern=params.pattern;
    };
    if(params.startTime){
        queryTime.$gte = moment(params.startTime)._i;
        delete params.startTime;
    };

    if(params.endTime){
        queryTime.$lte = moment(params.endTime)._i;
        delete params.endTime;
    };
    query.createTime=queryTime;
    dishesOrder.getDishesOrderByQuery(query,{},function(error,dishDate){
        if(error){
            return returnFAIL(res,error.message);
        }else{
            if(dishDate.length>0){
                var returnMsg=[];
                dealDishType(dishDate,returnMsg,res);
                return returnSUCCESS(res,returnMsg);
            } else{
                return returnFAIL(res,"没有查到数据！")
            };
        };
    })
});
function dealDishType(data,returnMsg,res){
    var dishTypeIds=[];
    data.forEach(function(item){
        if(item.dishesId){
            var dishTypeId=item.dishTypeId._id;
            var quant=item.quantity-item.recedeNum;
            if(tool.returnIndex(dishTypeId,dishTypeIds)==-1){
                var itemMsg={
                    quantity:quant,
                    dishTypeId:dishTypeId,
                    dishTypeName:item.dishTypeId.name,
                    price:(item.price)*(quant)
                };
                returnMsg.push(itemMsg);
                dishTypeIds.push(dishTypeId);
            }else{
                returnMsg.forEach(function(msg){
                    if(msg.dishTypeId==dishTypeId){
                        msg.quantity+=quant;
                        msg.price+=(quant)*(item.price)
                    };
                })
            };
        }else{
            return returnFAIL(res,"菜品订单无菜品Id！")
        };
    })
};
//退菜统计
router.post('/recedeDishSta',function(req,res){
    var params=req.body;
    var query={};
    var queryTime={};
    var num={
        $gt:parseInt(0)
    };
    if(params.pattern){
        query.pattern=params.pattern;
    };

    query.recedeNum=num;
    if(params.dishTypeId){
        query.dishTypeId=params.dishTypeId
    };
    if(params.startTime){
        queryTime.$gte = moment(params.startTime)._i;
        delete params.startTime;
    };

    if(params.endTime){
        queryTime.$lte = moment(params.endTime)._i;
        delete params.endTime;
    };

    query.createTime=queryTime;
    dishesOrder.queryRecedeDishSta(query,function(error,data){
            console.log(data);
            if(error){
                return returnFAIL(res,error.message);
            }else{
                if(data.length>0){
                    var returnMsg=[];
                    dealData(data,returnMsg);
                    return returnSUCCESS(res,returnMsg);
                }else{
                    return returnFAIL(res,"没有搜索到数据")
                };

            };
        }
    )
});
//处理退菜数据
function dealData(data,returnMsg){
    data.forEach(function(item){
        var typeIds=[];
        var typeId=item.dishTypeId._id
        if(tool.returnIndex(typeId,typeIds)==-1){
            var msg={
                dishTypeId:typeId,
                dishesId  :item.dishesId,
                name      :item.name,
                recedeNum :item.recedeNum,
                price     :item.price,
                waiter    :item.waiter,
                tablename :item.orderId.foundingInfo.diningTableName,
                createTime:item.createTime,
                remark    :item.remark
            };
            returnMsg.push(msg);
        }else{
            returnMsg.forEach(function(option){
                if(option.dishesId){
                    option.recedeNum+=option.recedeNum;
                }
            })
        }
    })
};
/**
 * 查询交接班记录
 */
router.post('/queryAlterLog',function(req,res){
    var params=req.body;
    console.log(params);
    var query={};
    var queryTime={};
    if(params.pattern){
        query.pattern=params.pattern;
    }
    if(params.startTime){
        queryTime.$gte = moment(params.startTime)._i;
        delete params.startTime;
    };

    if(params.endTime){
        queryTime.$lte = moment(params.endTime)._i;
        delete params.endTime;
    };
    if(params.operator){
        query.operator=params.operator
        delete  params.operator;
    }

    query.alternateDate=queryTime;
    console.log(query);
    alternateLog.getAlternateLogByQuery(query,function(error,data){
        if(error){
            return returnFAIL(res,error.message);
        }else if(data.length>0){
            return returnSUCCESS(res,data);
        }else{
            return returnFAIL(res,"没有查到交接班记录");
        };
    })
});

//会员统计
router.post('/memberSta',function(req,res){
    var params=req.body;
    console.log(params);
    var sumObj={
        createCount:0,
        cancelCount:0,
        data:[]
    };
    var query={};
    var queryTime={};
    if(params.pattern){
        query.pattern=params.pattern
    }
    if(params.startTime){
        queryTime.$gte=moment(params.startTime)._i
    }
    if(params.endTime){
        queryTime.$lte=moment(params.endTime)._i
    }

    if(params.membNo){
        query.membNo=params.membNo
    }
    var opt={};
    if(params.skip){
        opt.skip=params.skip
    }
    if(params.limit){
        opt.limit=params.limit
    }
    query.datetime=queryTime;

    async.auto({
        getCreMembCou:function(callback){
            diningMember.getMemberCount({datetime:queryTime,isDel:false,state:0},function(error,count){
              callback(error,count);
            })
        },
        getMembDeta:function(callback){
            diningMember.getMemberByQuery(query,opt,function(error,merberData){
              callback(error,merberData);
            })
        },
        getCanceMemb:function(callback){
            cancelMemberLog.getCancelMemberLogByQuery({datetime:queryTime},function(error,canceData){
                callback(error,canceData);
            })
        },
        getRecharData: function (callback) {
            rechargeLog.queryRechargeLog({datetime:queryTime}, function (err, rechargeLogData) {
                callback(err,rechargeLogData);
            })
        },
        getConsuData:function(callback){
            consumerLog.getConsumerLogByQuery({datetime:queryTime},function(err,consumerLogData){
                callback(err,consumerLogData)
            })
        },
        dealMemberDate:['getCreMembCou','getMembDeta','getCanceMemb','getRecharData','getConsuData',function(callback,allData) {
           var count=allData.getCreMembCou;
           var merberData=allData.getMembDeta;
           var canceData=allData.getCanceMemb;
           var recharData = allData.getRecharData;
           var consuData = allData.getConsuData;

            sumObj.createCount=count
            sumObj.cancelCount=canceData.length
            if(merberData.length>0){
                merberData.forEach(function(doc){
                    var part={
                        membNo       :doc.membNo,        // 会员卡号
                        smallNo      :doc.smallNo,       //小猫钱包帐号
                        state        :doc.state,         // 状态          正常：0 挂失：1 注销：2
                        membLevelId  :doc.membLevelId ,           // 会员等级     关联等级表
                        name         :doc.name,                                               // 姓名          不超过10个字符
                        tel          :doc.tel ,                                               // 手机号码
                        prepayments  :doc.prepayments,                                        // 预付款金额     验证数据类型为number
                        giveMoney    :doc.giveMoney ,                                         // 赠送金额
                        points       :doc.points,                                             // 积分          验证数据类型为number
                        datetime     :moment(doc.datetime)._i,                                // 创建时间
                        cancelTime   :moment(doc.cancelTime)._i,                              // 注销时间
                        remark       :doc.remark,                                             // 备注
                        rechargePrice:0,
                        rechargeGiveMo:0,
                        consumerPrice:0

                    }
                    if(recharData.length>0){
                        recharData.forEach(function (item) {
                            if (String(doc._id) == String(item.diningMemberId)) {
                                switch (item.mode){
                                    case 1:
                                        part.rechargePrice+=parseFloat(item.amount);
                                        part.rechargeGiveMo+=parseFloat(item.giveMoney)
                                        break;
                                    case 2:
                                        part.rechargePrice+=parseFloat(item.amount);
                                        part.rechargeGiveMo+=parseFloat(item.giveMoney)
                                }
                            }
                        })
                    }
                    if(consuData.length>0){
                        consuData.forEach(function(conItem){
                            if(String(doc._id)==String(conItem.diningMemberId)){
                                console.log(conItem.consumer);
                                part.consumerPrice +=parseFloat(conItem.consumer);
                                part.consumerPrice -=parseFloat(conItem.giveMoney);
                            }
                        })
                    }
                    sumObj.data.push(part);
                    delete  part;
                })
            }
            callback(null)
        }]
    },function(error){
        if(error){
            return returnFAIL(res,error.message);
        }else{
            return returnSUCCESS(res,sumObj);
        }
    })
});

module.exports = router;