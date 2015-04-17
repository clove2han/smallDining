/**
 * 2015/1/7
 * @module
 * @description 自动同步数据到小猫服务器上
 * @author 黄耀奎
 * @modified By
 */
var async = require('async'),
    request = require('request'),
    config = require(BASEDIR + '/app/config/config.json'),
    push = require(BASEDIR + '/tools/push'),
    tool = require(BASEDIR + '/tools/tool'),
    tran = require(BASEDIR + '/tools/transaction'),
    dishesType = require(PROXY).dishesType,
    path = require('path'),
    dishes = require(PROXY).dishes,
    table = require(PROXY).table,
    tableType=require(PROXY).tableType,
    flavor=require(PROXY).flavor;
    memberLevel=require(PROXY).memberLevel,
    pointsRule=require(PROXY).pointsRule,
    role=require(PROXY).role,
    diningMember=require(PROXY).diningMember,
    transaction = require(PROXY).transaction,
    staff=require(PROXY).staff,
    supplyTime=require(PROXY).supplyTime,
    restOrders=require(PROXY).restOrders,
    dishesOrder=require(PROXY).dishesOrder;
    rechargeLog=require(PROXY).rechargeLog;

/**
 * queue是一个串行的消息队列，通过限制了worker数量，不再一次性全部执行。
 * 当worker数量不够用时，新加入的任务将会排队等候，直到有新的worker可用。
 *
 * 该函数有多个点可供回调，如worker用完时、无等候任务时、全部执行完时等。
 */

/**
 * 定义一个queue，设worker数量为2
 */
var shopId = tool.getDiningId();
var q = async.queue(function(task, callback) {
    console.log(task.name+"开始同步");
    task.run(callback);
}, 2);
/**
 * 监听：如果某次push操作后，任务数将达到或超过worker数量时，将调用该函数
 */
q.saturated = function() {
    console.log('all workers to be used');
}

/**
 * 监听：当最后一个任务交给worker时，将调用该函数
 */
q.empty = function() {
    console.log('no more tasks wating');
}

/**
 * 监听：当所有任务都执行完以后，将调用该函数
 */
q.drain = function() {
    console.log('所有数据同步完成');
};

/**
 * 同步菜品类型
 */
function syncDishesType(){
    if(shopId == ''){
        return;
    }
    var query = {isUpload: false};
    var dishesTypeId = arguments[0] ? arguments[0]: "";

    if(dishesTypeId){
        query._id = dishesTypeId;
    }
    dishesType.getDishesTypeByQuery(query, {__v: 0}, function (err, dishesTypeData) {
        if(!err){
            if(dishesTypeData.length > 0){
                dishesTypeData.forEach(function(item){
                    (function (item) {
                        var smallUrl = "";
                    var smallData = {
                        shopId : shopId,
                        _id: String(item._id)
                    };
                    if(item.isDel){
                        smallUrl = "/server/merchant/shopDishesType/remove";
                    }else{
                        smallUrl = "/server/merchant/shopDishesType/push";
                        smallData.name = item.name;
                        smallData.sort = item.sort;
                    }

                    q.push({name:item.name,run: function(cb){
                        push.normalPushToSmall(smallUrl, smallData, function(err, result_small){
                            if(!err){
                                if(tool.isJson(result_small)) {
                                    if (JSON.parse(result_small).ResultCode == "SUCCESS") {
                                        dishesType.updateDishesType({_id: smallData._id}, {$set: {isUpload: true}}, function (err) {
                                            console.log(err);
                                        })
                                    }else{
                                        console.log(JSON.parse(result_small).Result);
                                    }
                                }else{
                                    console.log(result_small);
                                    console.log('同步菜品类型失败');
                                }
                            }
                        });
                        tool.fire(item.name, cb, 1000);
                    }}, function(err) {
                        if(err) console.log(err);
                    });
                    })(item);
                    
                });
            }
        }

    });
}
/**
 * 同步菜品信息
 */
function syncDishes(){
    if(shopId == ''){
        return;
    }
    var query = {};
    var dishesId = arguments[0] ? arguments[0]: "";
    if(dishesId){
        query._id = dishesId;
    }
    var smallUrl = "";
    dishes.getDishesByQuery(query, null, function (error, dishesData) {
        if (!error) {  //如果有错误，则输出错误信息
            if(dishesData.length > 0){
                dishesData.forEach(function(item){
                    var smallData = {};
                    smallData._id = String(item._id);
                    smallData.shopId = shopId;
                    if(item.isDel){
                        smallUrl = "/server/goods/dishes/remove";
                    }else{
                        smallUrl = "/server/goods/dishes/push";
                        smallData.hasImg = [];

                        //用不了for 和 for in
                        if(item.imgName){
                            smallData.hasImg.push({ImgName: 'imgName', ImgPath: path.normalize(BASEDIR + '/public/images/dishesPicture/'+ item.imgName)});
                        }
                        if(item.typeId){
                            smallData.shopDishesTypeId = String(item.typeId);
                        }
                        if(item.name){
                            smallData.name = item.name;
                        }
                        if(item.abbr){
                            smallData.abbr = item.abbr;
                        }
                        if(item.activityType){
                            smallData.activityType = item.activityType;
                        }
                        if(item.price){
                            smallData.price = item.price;
                        }
                        if(item.intro){
                            smallData.intro = item.intro;
                        }
                        if(item.flavorId.length > 0){
                            var flavor="";
                            var flavorInfo=[];
                            for(var j=0;j<item.flavorId.length;j++){
                                flavor=item.flavorId[j];
                                flavorInfo.push(flavor._id);
                            }
                            smallData.flavorId =flavorInfo;
                        }

                        if(item.salePrice){
                            smallData.salePrice = item.salePrice;
                        }
                        if(item.state){
                            smallData.state = item.state;
                        }
                        if(item.salesVolume){
                            smallData.salesVolume = item.salesVolume;
                        }
                        if(item.remark){
                            smallData.remark = item.remark;
                        }
                        if(item.createDate){
                            smallData.createDate = String(item.createDate);
                        }
                        if(item.sort){
                            smallData.sort = item.sort;
                        }
                        if(item.surplus){
                            smallData.surplus = item.surplus;
                        }
                        if(item.haveOnNumber){
                            smallData.haveOnNumber = item.haveOnNumber;
                        }
                        if(item.goingSurplus){
                            smallData.goingSurplus = item.goingSurplus;
                        }
                        if(item.goingHaveOnNumber){
                            smallData.goingHaveOnNumber = item.goingHaveOnNumber;
                        }
                        if(item.supplyTimeId){
                            smallData.supplyTimeId = item.supplyTimeId;
                        }

                        switch (item.saleType){
                            case 1:
                                smallData.isTakeOut = "true";
                                smallData.isReserve = "true";
                                break;
                            case 2:
                                smallData.isTakeOut = "true";
                                break;
                            case 3:
                                smallData.isReserve = "true";
                                break;
                        }
                    }
                    q.push({name:item.name,run: function(cb){
                        try{
                            if(item.isDel){
                                push.normalPushToSmall(smallUrl,smallData,function(err,result_small){
                                    if(!err){
                                        if(JSON.parse(result_small).ResultCode=="SUCCESS"){
                                            dishes.updateDishes({_id:smallData._id},{$set: {isUpload: true}},function(err){
                                                console.log(err);
                                            })
                                        }
                                    }
                                });
                            }else{
                                push.pushToSmall(smallUrl, smallData, function(err, result_small){
                                    if(!err){
                                        if(tool.isJson(result_small)) {
                                            if (JSON.parse(result_small).ResultCode == "SUCCESS") {
                                                dishes.updateDishes({_id: smallData._id}, {$set: {isUpload: true}}, function (err) {
                                                    if (err) {
                                                        console.log(err);
                                                    }
                                                })
                                            }else{
                                                console.log(result_small);
                                            }
                                        }else{
                                            console.log(result_small);
                                        }

                                    }
                                });
                            }

                        }catch (e){
                            console.log(e);
                        }
                        tool.fire(item.name, cb, 1000); //一秒后执行
                    }}, function(err) {
                        if(err) console.log(err);
                    });
                })
            }
        }else{
            console.log(error);
        }
    });
}


/**
 * 同步台位类型的增加 修改  和删除 方法
 */
function syncTableType(){
    if(shopId == ''){
        return;
    }
    var query = {isUpload: false};
    var tableTypeId = arguments[0] ? arguments[0]: "";
    if(tableTypeId){
        query._id = tableTypeId;
    }
    var smallUrl = "";
    tableType.getTableTypeByQuery(query, null, function(err, tableTypeData){
        if(!err){
            if(tableTypeData.length>0){
                tableTypeData.forEach(function(item){
                    var smallData={};
                    smallData._id=String(item._id);
                    smallData.shopId=shopId;
                    if(item.isDel){
                        smallUrl="/server/merchant/tableType/remove";
                    }else{
                        smallUrl="/server/merchant/tableType/push";
                        if(item.name){
                            smallData.name=item.name;
                        }
                        if(item.sort){
                            smallData.sort=item.sort;
                        }
                        if(item.number){
                            smallData.number=item.number;
                        }
                        smallData.state=item.state||false;
                    }
                    q.push({name:item.name,run:function(cd){
                        push.normalPushToSmall(smallUrl,smallData,function(err,result_small){
                            if(!err){
                                console.log("--------------------------------");
                                console.log(result_small);
                                if(tool.isJson(result_small)){
                                    if(JSON.parse(result_small).ResultCode=="SUCCESS"){
                                        tableType.updateTableType({_id:smallData._id},{$set: {isUpload: true}},function(err){
                                            console.log(err);
                                        })
                                    }else{
                                       console.log(result_small);
                                    }
                                }else{
                                    console.log('不是json');
                                }

                            }
                        });
                        tool.fire(item.name,cd,1000);
                    }},function(err){
                        if(err){
                            console.log(err);
                        }
                    });
                })
            }
        }
    });
}
/**
 *同步台位的添加 修改 和删除的方法
 */
function syncTable(){
    if(shopId == ''){
        return;
    }
    var query={isUpload:false};
    var tableId=arguments[0] ? arguments[0] :"";
    if(tableId){
        query._id=tableId;
    }
    var smallUrl="";
    table.getTableByQuery(query,null, function (err,tableData){
        if(!err){
            if(tableData.length>0){
                tableData.forEach(function(item){
                    var smallData={};
                    smallData._id=String(item._id);
                    smallData.shopId=shopId;
                    if(item.isDel){
                        smallUrl="/server/merchant/table/remove";
                    }else{
                        smallUrl="/server/merchant/table/push";
                        if(item.tableTypeId){
                            smallData.tableTypeId = String(item.tableTypeId);
                        }
                        if(item.name){
                            smallData.name=item.name;
                        }
                        smallData.orderId= item.orderId ? String(item.orderId): "";
                        if(item.sort){
                            smallData.sort=item.sort;
                        }
                        if(item.state){
                            smallData.state=item.state;
                        }

                        smallData.mealsNumber = item.mealsNumber || 0;

                        if(item.openDate){
                            smallData.openDate=String(item.openDate);
                        }

                        smallData.remark=item.remark || "";

                    };
                    q.push({name:item.name,run:function(cb){
                            push.normalPushToSmall(smallUrl,smallData,function(err,result_small){
                                console.log("--------------------------------");
                                console.log(result_small);
                                if(!err){
                                    if(tool.isJson(result_small)){
                                        if(JSON.parse(result_small).ResultCode=="SUCCESS"){
                                            table.updateTable({_id:item._id},{$set: {isUpload: true}},function(err){
                                                if(err){
                                                    console.log(err);
                                                }
                                            })
                                        }else{
                                            console.log(JSON.parse(result_small).ResultCode);
                                        }
                                    }else{
                                        console.log("不是json");
                                    }
                                }
                            });

                        tool.fire(item.name,cb,1000);
                    }},function(err){
                        if(err){
                            console.log(err);
                        }
                    });
                });
            }
        }
    });
}
/**
 * 同步菜品口味 的添加 更新 和删除方法
 */
function syncFlavor(){
    if(shopId == ''){
        return;
    }
    var query = {isUpload:false};
    var flavorId = arguments[0] ? arguments[0]: "";

    if(flavorId){
        query._id = flavorId;
    }

    var smallUrl = "";
    flavor.getFlavorByQuery(query,null,function(err,flavorData){
        if(!err){
            if(flavorData.length>0){
                console.log(flavorData);
                flavorData.forEach(function(item){
                    var smallData={};
                    smallData._id=String(item._id);
                    smallData.shopId=shopId;
                    if(item.isDel){
                        smallUrl='/server/goods/dishesFlavor/remove';
                    }else{
                        smallUrl='/server/goods/dishesFlavor/push';
                        if(item.name){
                            smallData.name=item.name;
                        }
                    }
                    q.push({name:item.name, run:function(cb){
                        push.normalPushToSmall(smallUrl,smallData,function(err,result_small){
                            console.log("--------------------------------");
                            console.log(result_small);
                            if(!err){
                                if(tool.isJson(result_small)){
                                    if(JSON.parse(result_small).ResultCode=="SUCCESS"){
                                        flavor.updateFlavor({_id:item._id},{$set: {isUpload: true}},function(err){
                                            if(err){
                                                console.log(err);
                                            }else{
                                                console.log('同步口味成功！');
                                            }
                                        })
                                    }else{
                                       console.log(JSON.parse(result_small).ResultCode);
                                    }
                                }else{
                                    console.log("不是json");
                                }
                            }
                        });
                        tool.fire(item.name,cb,1000);
                    }},function(err){
                        if(err){
                            console.log(err);
                        }
                    });
                });
            }
        }
    });
}


/**
 * 同步会员等级数据
 */
function syncMemberLevel(){
    if(shopId == ''){
        return;
    }
    var query = {isUpload:false};
    var memberLevelId = arguments[0] ? arguments[0]: "";

    if(memberLevelId){
        query._id = memberLevelId;
    }
    var smallUrl = "";
    memberLevel.getMemberLevel(query,null,function (err,memberLevelData){
        if(!err){
            if(memberLevelData.length>0){
                memberLevelData.forEach(function (item){
                    var smallData={};
                    smallData._id=String(item._id);
                    smallData.shopId=shopId;
                    if(item.isDel){
                        smallUrl="/server/shop/shopMemberLevel/remove";
                    }else{
                        smallUrl="/server/shop/shopMemberLevel/push";
                        if(item.name){
                            smallData.name=item.name;
                        }
                        smallData.minAmount=item.minAmount||0;
                        if(item.maxAmount){
                            smallData.maxAmount=item.maxAmount;
                        }
                        if(item.discounts){
                            smallData.discounts=item.discounts;
                        }
                    }
                    q.push({name:item.name,run:function(cb){
                        push.normalPushToSmall(smallUrl,smallData,function(err,result_small){
                            console.log("--------------------------------");
                            console.log(result_small);
                            if(!err){
                                if(tool.isJson(result_small)){
                                    if(JSON.parse(result_small).ResultCode=="SUCCESS"){
                                        memberLevel.updateMemberLevel({_id:item._id},{$set: {isUpload: true}},function(err){
                                            if(err){
                                                console.log(err);
                                            }else{
                                                console.log('同步会员等级成功！');
                                            }
                                        })
                                    }else{
                                        console.log(JSON.parse(result_small).ResultCode);
                                    }
                                }else{
                                    console.log(result_small);
                                    console.log('不是json');
                                }
                            }
                        });
                        tool.fire(item.name,cb,1000);
                    }},function(err){
                        if(err){
                            console.log(err);
                        }
                    });
                });
            }
        }
    });
}
/**
 * 同步积分规则数据
 */
function syncPointsRule(){
    if(shopId == ''){
        return;
    }
    var query={isUpload:false};
    var pointsId=arguments[0] ? arguments[0] :"";
    if(pointsId){
        query._id=pointsId;
    }
    var smallUrl="";
    pointsRule.getPointsRule(query,null,function(err,pointsRuleData){
        if(!err){
            if(pointsRuleData.length>0){
                pointsRuleData.forEach(function(item){
                    var smallData={};
                    smallData._id=String(item._id);
                    smallData.shopId=shopId;
                    if(item.isDel){
                        smallUrl="/server/shop/shopPointsRule/remove";
                    }else{
                        smallUrl="/server/shop/shopPointsRule/push";
                        if(item.consumer){
                            smallData.consumer=item.consumer;
                        }
                        smallData.returnPoints=item.returnPoints||0;

                    };
                    q.push({name:item._id,run:function(cb){
                        push.normalPushToSmall(smallUrl,smallData,function(err,result_small){
                            console.log("--------------------------------");
                            console.log(result_small);
                            if(!err) {
                                if(tool.isJson(result_small)){
                                    if (JSON.parse(result_small).ResultCode == "SUCCESS") {
                                        pointsRule.updatePointsRule({_id:item._id},{$set:{isUpload:true}},function(err){
                                            if(err){
                                                console.log(err);
                                            }
                                        })
                                    } else {
                                        console.log(JSON.parse(result_small).ResultCod);
                                    }
                                }else{
                                    console.log('不是json');
                                    console.log(result_small);
                                }
                            }
                        });
                        tool.fire(String(item._id),cb,1000);
                    }},function(err){
                        if(err){
                            console.log(err);
                        }
                    });
                });
            }

        }
    });
}
/**
 * 同步角色数据
 */
function syncRole(){
    if(shopId == ''){
        return;
    }
    var query={isUpload:false};
    var roleId=arguments[0] ? arguments[0] :"";
    if(roleId){
        query._id=roleId;
    }
    var smallUrl="";
    role.getRoleByQuery(query,null,function(err,roleData){
        if(!err){
            if(roleData.length>0){
                roleData.forEach(function(item){
                    var smallData={};
                    smallData._id=String(item._id);
                    smallData.shopId=shopId;
                    if(item.isDel){
                        smallUrl="/server/shop/shopRole/remove";
                    }else{
                        smallUrl="/server/shop/shopRole/push";
                        if(item.name){
                            smallData.name=item.name;
                        }
                        if(item.permissionList.length>0){
                             smallData.permissionList= JSON.stringify(item.permissionList);
                        }
                    };
                    q.push({name:item.name,run:function(cb){
                        push.normalPushToSmall(smallUrl,smallData,function(err,result_small){
                            console.log("--------------------------------");
                            console.log(result_small);
                            if(!err){
                                if(tool.isJson(result_small)){
                                    if(JSON.parse(result_small).ResultCode=="SUCCESS"){
                                        role.updateRole({_id:item._id},{$set:{isUpload:true}},function(err){
                                            if(err){
                                                console.log(err);
                                            }else{
                                                console.log('同步角色成功')
                                            }
                                        })
                                    }else{
                                        console.log(result_small);
                                    }
                                }else{
                                    console.log('不是json');
                                }
                            }
                        });
                        tool.fire(item.name,cb,1000);
                    }},function(err){
                        if(err){
                            console.log(err);
                        }
                    })
                })
            }
        }
    })
}
/**
 * 同步会员数据
 */
function syncDiningMember(){
    if(shopId == ''){
        return;
    }
    var query={isUpload:false};
    var diningMemberId=arguments[0] ? arguments[0] :"";
    if(diningMemberId){
        query._id=diningMemberId;
    }
    var smallUrl="";
    diningMember.getMemberByQuery(query,null,function(err,memberData){
        if(!err){
            if(memberData.length>0){
                memberData.forEach(function(item){
                    var smallData={};

                    smallData._id=String(item._id);
                    smallData.shopId=shopId;
                    if(item.isDel){
                        smallUrl="/server/shop/shopDiningMember/remove";
                    }else{
                        smallUrl="/server/shop/shopDiningMember/push";
                        if(item.membNo){
                            smallData.membNo=item.membNo;
                        }
                        smallData.state=item.state||0;

                        if(item.membLevelId){
                            smallData.membLevelId=String(item.membLevelId);
                        }
                        if(item.name){
                            smallData.name=item.name;
                        }
                        if(item.tel){
                            smallData.tel=item.tel;
                        }
                        smallData.prepayments=item.prepayments||0;
                        if(item.points){
                            smallData.points=item.points;
                        }
                        if(item.datetime){
                            smallData.datetime=String(item.datetime)
                        }/*else{
                            smallData.datetime=String(new Date(2012, 8, 12, 10, 37, 11));
                        }*/
                        smallData.remark=item.remark||"";
                        smallData.safe=item.safe||true;
                        smallData.smallNo=item.smallNo||""
                    }

                    q.push({name:item.name,run:function(cb){
                        push.normalPushToSmall(smallUrl,smallData,function(err,result_small){
                            console.log("--------------------------------");
                            console.log(result_small);
                            if(!err){
                                if(tool.isJson(result_small)){
                                    if(JSON.parse(result_small).ResultCode=="SUCCESS"){
                                        diningMember.updateMember({_id:item._id},{$set:{isUpload:true}},function(err){
                                            if(err){
                                                console.log(err);
                                            }
                                        })
                                    }else{
                                        console.log(JSON.parse(result_small).ResultCode);
                                    }
                                }else{
                                    console.log('-----不是json');
                                    console.log(result_small);
                                }
                            }
                        });
                        tool.fire(item.name,cb,1000);
                    }},function(err){
                        if(err){
                            console.log(err);
                        }
                    })
                })
            }
        }
    })
}
/**
 * 同步员工数据
 */
function syncStaff(){
    if(shopId == ''){
        return;
    }
    var query={isUpload:false};
    var staffId=arguments[0] ? arguments[0] :"";
    if(staffId){
        query._id=staffId;
    }
    var smallUrl="";
    staff.getStaffByQuery(query,null,function(err,staffData){
        if(!err){
            if(staffData.length>0){
                staffData.forEach(function(item){
                    var smallData={};
                    smallData._id=String(item._id);
                    smallData.shopId=shopId;
                    if(item.isDel){
                        smallUrl="/server/shop/shopStaff/remove";
                    }else{
                        smallUrl="/server/shop/shopStaff/push";
                        if(item.account){
                            smallData.account=item.account;
                        }

                        smallData.isAlternate=item.isAlternate||true;

                        if(item.userName){
                            smallData.userName=item.userName;
                        }
                        if(item.password){
                            smallData.password=item.password;
                        }

                        smallData.state=item.state||true;

                        if(item.role){
                            smallData.role=String(item.role._id);
                        }
                        if(item.position){
                            smallData.position=item.position;
                        }
                        if(item.createDate){
                            smallData.createDate=String(item.createDate);
                        }
                        if(item.loginDate){
                            smallData.loginDate=String(item.loginDate);
                        }
                    };
                    q.push({name:item.userName,run:function(cb){
                        push.normalPushToSmall(smallUrl,smallData,function(err,result_small){
                            console.log("--------------------------------");
                            console.log(result_small);
                            if(!err){
                                if(tool.isJson(result_small)){
                                    if(JSON.parse(result_small).ResultCode=="SUCCESS"){
                                        staff.updateStaff({_id:item._id},{$set:{isUpload:true}},function(err){
                                          if(err){
                                            console.log(err);
                                          }
                                        });
                                    }else{
                                        console.log(JSON.parse(result_small).ResultCode);
                                    }
                                }else{
                                    console.log('不是json')
                                }
                            }
                        });
                        tool.fire(item.userName,cb,1000);
                    }},function(err){
                        if(err){
                            console.log(err);
                        }
                    });
                });
            }
        }
    });
}
/**
 * 同步供应时段数据
 */
function syncSupplyTime(){
    if(shopId == ''){
        return;
    }
    var query={isUpload:false};
    var supplyTimeId=arguments[0] ? arguments[0] :"";
    if(supplyTimeId){
        query._id=supplyTimeId;
    }
    var smallUrl="";
    supplyTime.querySupplyTime(query,function(err,supplyTimeDate){
        if(!err){
            if(supplyTimeDate.length>0){
                supplyTimeDate.forEach(function(item){
                    var smallData={};
                    smallData._id=String(item._id);
                    smallData.shopId=shopId;
                    if(item.isDel){
                        smallUrl="/server/shop/shopSupplyTime/remove";
                    }else{
                        smallUrl="/server/shop/shopSupplyTime/push";
                        if(item.name){
                            smallData.name=item.name;
                        }
                        if(item.img){
                            smallData.hasImg.push({ImgName: 'imgName', ImgPath: path.normalize(BASEDIR + '/public/images/dishesPicture/'+ item.img)});
                        }
                        smallData.remark=item.remark || "";
                    };
                    q.push({name:item.name,run :function(cb){
                        push.pushToSmall(smallUrl,smallData,function(err,result_small){
                            console.log("--------------------------------");
                            console.log(result_small);
                            if(!err){
                                if(tool.isJson(result_small)){
                                    if(JSON.parse(result_small).ResultCode=="SUCCESS"){
                                        supplyTime.updateOneSupplyTime({_id:item._id},{$set: {isUpload: true}},function(err){
                                            if(err){
                                                console.log(err);
                                            }
                                        })
                                    }else{
                                        console.log(JSON.parse(result_small).ResultCode);
                                    }
                                }else{
                                    console.log('不是json');
                                }
                            }
                        });
                        tool.fire(item.name,cb,1000);
                    }},function(err){
                        if(err){
                            console.log(err);
                        }
                    });
                });
            }
        }
    });
}
/**
 * 同步订单数据
 */

function syncRestOrders(){
     if(shopId==''){
       return
     }
    var query={isUpload:false,orderState:1,isDone:true,ongoing:false};
     var restOrdersId=arguments[0] ? arguments[0] :"";
     if(restOrdersId){
         query._id=restOrdersId;
     }
     var smallUrl="";
     restOrders.getRestOrdersByQueryNoOpt(query,null,function(err,restOrdersData){
        if(!err) {
             if(restOrdersData.length>0){
                 restOrdersData.forEach(function(item){
                 var smallData= {
                         shopDishesOrder: []
                 };
                 smallData._id=String(item._id);
                 smallData.shopId=shopId;
                 smallUrl="/server/shop/shopRestOrders/push";
                 //根据订单数据模型中的_id 找到相对应的菜品订单
                     if(item.orderNumber){
                         smallData.orderNumber=String(item.orderNumber);
                     }
                     smallData.orderState=item.orderState||0;
                     if(item.orderType){
                         smallData.orderType=item.orderType;
                     }
                     if(item.pattern){
                         smallData.pattern=item.pattern;
                     }
                     if(item.diningMemberId){
                         smallData.diningMemberId=String(item.diningMemberId);
                     }
                     if(item.createDate){
                         smallData.createDate=String(item.createDate);
                     }
                     if(item.cashier) {
                         var as=item.cashier;
                         smallData.cashier={
                             name:as.name,
                             cashierId:String(as.cashierId)
                         };
                         smallData.cashier=JSON.stringify(smallData.cashier);
                     }
                     if(item.foundingInfo){
                         smallData.foundingInfo=JSON.stringify(item.foundingInfo);
                     }
                     if(item.deliverInfo){
                         smallData.deliverInfo=JSON.stringify(item.deliverInfo);
                     }
                     if(item.groupbuyInfo){
                         smallData.groupbuyInfo=JSON.stringify(item.groupbuyInfo);
                     }
                     smallData.totalPrice=item.totalPrice||0;
                     if(item.discount){
                         smallData.discount=item.discount;
                     }
                     smallData.discountPrice=item.discountPrice||0;
                     smallData.backPoints=item.backPoints||0;
                     smallData.isInvoice=item.isInvoice||false;
                     if(item.payment){
                         smallData.payment=JSON.stringify(item.payment);
                     }
                     if(item.refund){
                         smallData.refund=JSON.stringify(item.refund);
                     }
                     smallData.backState=item.backState || 0;
                     if(item.backTime){
                         smallData.backTime=String(item.backTime);
                     }
                     if(item.backApply){
                         smallData.backApply=JSON.stringify(item.backApply);
                     }
                     smallData.isPack=item.isPack||false;
                     if(item.payDate){
                         smallData.payDate=String(item.payDate);
                     }
                     if(item.onLineChangeBackApply){
                         smallData.onLineChangeBackApply=JSON.stringify(item.onLineChangeBackApply);
                     }
                     if(item.offlineChangeBackApply){
                         smallData.offlineChangeBackApply=JSON.stringify(item.offlineChangeBackApply);
                     }
                     smallData.ongoing=item.ongoing||false;
                     smallData.isDone=item.isDone||false;
                     var condition={orderId:String(item._id)};
                     dishesOrder.getDishesOrderByQuery(condition, null,function(err,dishOrdersData){
                         if(!err) {
                             if(dishOrdersData && dishOrdersData.length>0){
                                 dishOrdersData.forEach(function (dishItem) {
                                     var obj = {};
                                     obj._id = String(dishItem._id);
                                     if (dishItem.orderId) {
                                         obj.orderId=String(dishItem.orderId._id);
                                     }
                                     if (dishItem.dishTypeId) {
                                         obj.dishTypeId =String(dishItem.dishTypeId._id);
                                     }
                                     if (dishItem.dishesId) {
                                         obj.dishesId =String( dishItem.dishesId._id);
                                     }
                                     if (dishItem.waiter) {
                                         obj.waiter = dishItem.waiter;
                                     }
                                     if (dishItem.name) {
                                         obj.name = dishItem.name;
                                     }
                                     if (dishItem.quantity) {
                                         obj.quantity = dishItem.quantity;
                                     }
                                     if (dishItem.price) {
                                         obj.price = dishItem.price;
                                     }
                                     if(dishItem.createTime){
                                         obj.createTime =String(dishItem.createTime);
                                     }/*else{
                                         obj.createTime =String(new Date(2012, 8, 12, 10, 37, 11));
                                     }*/

                                     if (dishItem.state) {
                                         obj.state = dishItem.state;
                                     }
                                     if (dishItem.flavor) {
                                         obj.flavor = JSON.stringify(dishItem.flavor);
                                     }

                                     obj.goUpNum = dishItem.goUpNum|| 0;


                                     obj.recedeNum = dishItem.recedeNum|| 0;

                                     if (dishItem.type) {
                                         obj.type = dishItem.type;
                                     }

                                     obj.number = dishItem.number||0;

                                     obj.remark = dishItem.remark || "";
                                     if (dishItem.pendingTransaction) {
                                         obj.pendingTransaction = JSON.stringify(dishItem.pendingTransaction);
                                     }
                                     smallData.shopDishesOrder.push(obj);
                                 });
                                 if(smallData.shopDishesOrder){
                                     smallData.shopDishesOrder = JSON.stringify(smallData.shopDishesOrder);
                                 }
                                 q.push({name:item.orderNumber,run :function(cb){
                                     push.normalPushToSmall(smallUrl,smallData,function(err,result_small){

                                         console.log(result_small);
                                         if(!err){
                                             if(tool.isJson(result_small)){
                                                 if(JSON.parse(result_small).ResultCode=="SUCCESS"){
                                                     restOrders.updateRestOrders({_id:item._id},{$set:{isUpload:true}},function(err){
                                                         if(err){
                                                            console.log(err);
                                                         }
                                                     });
                                                     var ad=[];
                                                     ad=JSON.parse(smallData.shopDishesOrder);
                                                     for(var i=0;i<ad.length;i++){
                                                         var dishesOrdrId=ad[i]._id;
                                                         dishesOrder.updateDishesOrder({_id:dishesOrdrId},{$set:{isUpload:true}},function(err){
                                                          if(err){
                                                              console.log(err);
                                                          }
                                                         })
                                                     }
                                                 }else{
                                                     console.log(JSON.parse(result_small).ResultCode);
                                                 }
                                             }else{
                                                 console.log(result_small);
                                                 console.log('不是json')
                                             }
                                         }else{
                                             console.log(result_small);
                                         }
                                     });
                                     tool.fire(item.orderNumber,cb,1000);
                                 }},function(err){
                                     console.log(err);
                                 });
                             }else {
                                 console.log("没有菜品信息");
                             }
                         }else{
                             console.log('查询菜单时错误'+err);
                         }
                     });
                     });
                     }
                     }
               });
}
//同步充值日志
function syncRechargeLog(){
    if(shopId == ''){
        return;
    }

    var query={isUpload:false};
    var rechargelogId=arguments[0]?arguments:"";
    if(rechargelogId){
        query._id=rechargelogId;
    }
    var smallUrl="";
    rechargeLog.queryRechargeLog(query,function(error,rechargeData){
        if(!error){
            if(rechargeData.length>0){
                rechargeData.forEach(function(item){
                    var smallData={};
                    smallData._id=String(item._id);
                    smallData.shopId=shopId;
                    if(item.isDel){
                        smallUrl="/server/shop/shopRechargeLog/remove";
                    }else{
                        smallUrl="/server/shop/shopRechargeLog/push";
                        if(item.amount){
                            smallData.amount=item.amount;
                        }
                        if(item.diningMemberId){
                            smallData.diningMemberId=String(item.diningMemberId);
                        }
                        if(item.mode){
                            smallData.mode=item.mode;
                        }
                        if(item.datetime){
                            smallData.createTime=String(item.datetime);
                        }
                        if(item.operator){
                            smallData.operator=String(item.operator);
                        }
                        if(item.remark){
                            smallData.remark=item.remark;
                        }
                    };
                    console.log(smallData);
                    q.push({name:item._id,run:function(cb){
                        push.normalPushToSmall(smallUrl,smallData,function(err,result_small){
                            if(!err){
                                if(JSON.parse(result_small).ResultCode=="SUCCESS"){
                                    rechargeLog.updateRechargeLog({_id:item._id},{$set:{isUpload:true}},function(err){
                                        if(err){
                                            console.log(err);
                                        }
                                    });
                                }else{
                                    console.log(JSON.parse(result_small).ResultCode)
                                }
                            }else{
                                console.log(err)
                            }
                        });
                        tool.fire(item._id,cb,1000);
                    }},function(err){
                        if(err){
                            console.log(err)
                        }
                    });
                })
            }
        }else{
            console.log(error.message);
        }
    })

}
/**
 * 同步全部数据
 */
function all(){
    if(shopId == ''){
        return;
    }
    syncDishesType();
    syncDishes();
    syncTableType();
    syncTable();
    syncFlavor();
    syncDiningMember();
    syncMemberLevel();
    syncPointsRule();
    syncRole();
    syncStaff();
    syncSupplyTime();
    syncRestOrders();
}

exports.all = all;
exports.syncDishesType = syncDishesType;
exports.syncDishes = syncDishes;
exports.syncTableType = syncTableType;
exports.syncTable = syncTable;
exports.syncFlavor=syncFlavor;
exports.syncDiningMember=syncDiningMember;
exports.syncMemberLevel=syncMemberLevel;
exports.syncPointsRule = syncPointsRule;
exports.syncRole = syncRole;
exports.syncStaff=syncStaff;
exports.syncSupplyTime=syncSupplyTime;
exports.syncRestOrders=syncRestOrders;
exports.syncRechargeLog=syncRechargeLog;

