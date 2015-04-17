/**
 * 2014/10/15
 * @module
 * @description 职员路由
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router();
var validator = require('validator');
var utils = require('utility');
var staff = require(PROXY).staff;
var tool = require(BASEDIR + '/tools/tool');
var syncData = require(BASEDIR+ '/tools/syncData');
var async = require('async');
var alternateLog = require(BASEDIR + '/app/proxy/alternateLog');



/*职员添加
 *get url: /staff/add
 * @param  account string 职员帐号
 * @param  userName string 姓名
 * @param  password string 密码
 * @param  role string 角色
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': 添加成功};
 * error:
 * {'ResultCode': 'SUCCESS', 'Result': '失败信息'};
 */
router.post('/add', function (req, res) {
    var newStaff = deleteNull(validator,req.body);
    if(newStaff.cookTypeIds && tool.isJson(newStaff.cookTypeIds)){
        newStaff.cookTypeIds = JSON.parse(newStaff.cookTypeIds);
    }


    async.auto({
        getStaffInfo: function (cb) {
            //添加前判断是否是之前删除过的菜品，如果是把恢复并修改它
            staff.getOneStaff({account: newStaff.account, isDel:true}, function (err, dishesData) {
                cb(err, dishesData);
            });
        },
        waitDishesInfo: ['getStaffInfo', function (cb, data) {
            if(tool.isObjectEmpty(data.getStaffInfo)){
                staff.addStaff(newStaff, function (err, jellybean) {
                    cb(err, jellybean);
                });
            }else{
                newStaff.isDel = false;
                newStaff.isUpload = false;
                var update = {$set: newStaff};
                staff.updateStaff({_id: data.getStaffInfo._id}, update, function (err, result) {
                    cb(err, result);
                });
            }
        }]
    }, function (err, result) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            syncData.syncStaff(result._id);
            return returnSUCCESS(res, '添加成功');
        }
    });
});

/*职员查询
 *get url: /staff/query
 * @param  _id string 职员_id
 * @param  account string 职员帐号
 * @param  userName string 姓名
 * @param  state string 状态
 * @param  role string 角色
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': staffs};
 * error:
 * {'ResultCode': 'SUCCESS', 'Result': '失败信息'};
 */
router.post('/query', function (req, res) {

    var query = deleteNull(validator,req.body);
    if(query.account){
        query.account = new RegExp(query.account);
    }
    if(query.userName){
        query.userName = new RegExp(query.userName);
    }
    query.isDel = false;
    staff.getStaffByQuery(query, {}, function (err, staffs) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, staffs);
        }
    });
});

/*职员删除
 *get url: /staff/delete
 * @param  _id string 职员_id
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': 删除成功};
 * error:
 * {'ResultCode': 'SUCCESS', 'Result': '失败信息'};
 */
router.post('/delete', function (req, res) {
    var id = validator.escape(req.body._id).trim();

    staff.getOneStaff({_id: id}, function (err, doc) {
        if(err){
            return returnFAIL(res, err.message);
        }else if(doc){
            if(!doc.isAlternate){
                return returnFAIL(res, "该收银员还没交换班，不允许删除");
            }else{
                staff.updateStaff({_id: id}, {$set: {isDel: true}}, function (err) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }else{
                        syncData.syncStaff(id);
                        return returnSUCCESS(res, '删除成功');
                    }
                });
            }
        }else{
            return returnFAIL(res, "没有找到要修改的员工");
        }

    })

});


/*职员修改
 *get url: /staff/update
 * @param  _id string 职员_id
 * @param  account string 职员帐号
 * @param  userName string 姓名
 * @param  password string 密码
 * @param  state string 状态
 * @param  role string 角色
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': 修改成功};
 * error:
 * {'ResultCode': 'SUCCESS', 'Result': '失败信息'};
 */
router.post('/update', function (req, res) {
    var query = {}, update = {};
    var params = deleteNull(validator, req.body);
    if(params._id){
        query._id = params._id;
        if(params.cookTypeIds && tool.isJson(params.cookTypeIds)){
            params.cookTypeIds = JSON.parse(params.cookTypeIds);
        }
        staff.getOneStaff(query, function (err, doc) {
            if(err){
                return returnFAIL(res, err.message);
            }else if(doc){
                if(!doc.isAlternate){
                    return returnFAIL(res, "该收银员还没交换班，不允许修改");
                }else{
                    delete params._id;

                    if(params.password){
                        params.password = utils.md5(params.password);
                    }
                    update = {$set: params};

                    staff.updateStaff(query, update, function (err, data) {
                        if(err){
                            return returnFAIL(res, err.message);
                        }else{
                            syncData.syncStaff(query._id);
                            return returnSUCCESS(res, '修改成功');
                        }
                    });
                }
            }else{
                return returnFAIL(res, "没有找到要修改的员工");
            }

        })
    }
});

/** 验证是否有店长或经理权限(根据密码)
 * 更新员工的交接状态
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': true};
 * error:
 * {'ResultCode': 'SUCCESS', 'Result': '失败信息'};
 */
router.post('/verifyAuthority', function (req, res) {
    var params=req.body;
    console.log(params);
    var query={};
    if(params.password){
        query.password=utils.md5(params.password);
        query.isDel=false;
        delete params.password;
    }
    if(params.operator){
        console.log(params.operator);
    }else{
        return returnFAIL(res,"没有店长ID")
    }

    staff.getStaffByQuery(query,function(err,docs){
        if(err){
            return returnFAIL(res,err.message);
        }else if(docs.length>0){
            var result=false;
            docs.forEach(function(item){
                //如果权限是5：业务管理员 或6：店长
                if(tool.returnIndex(6,item.role.permissionList) !== -1 ||tool.returnIndex(5,item.role.permissionList) !== -1){
                    result=true;
                    params.confirmUser=item.userName;
                    alternateLog.addOneAlternateLog(params, function(err, alterData){
                        if(err){
                            return returnFAIL(res,err.message)
                        }else{
                            console.log("添加到数据库的")
                            console.log(alterData);
                            return returnSUCCESS(res,alterData);
                        }
                    });
                }
            });
            if(!result){
                return returnFAIL(res,"权限不足！");
            }
        }else{
            return returnFAIL(res,"密码错误");
        }
    })

});
/**
 *退菜验证权限
 */
router.post('/verifyBoss', function (req, res) {
    var params=req.body;
    var query={};
    if(params.password){
        query.password=utils.md5(params.password);
        query.isDel=false;
        delete params.password;
    }

    staff.getStaffByQuery(query,function(err,docs){
        if(err){
            return returnFAIL(res,err.message);
        }else if(docs.length>0){
            var result=false;
            docs.forEach(function(item){
                //如果权限是5：业务管理员 或6：店长
                if(tool.returnIndex(6,item.role.permissionList) !== -1 ||tool.returnIndex(5,item.role.permissionList) !== -1){
                    result=true;
                    return returnSUCCESS(res,"授权成功！")
                };
            })
            if(!result){
                return returnFAIL(res,"权限不足！")
            }
        }else{
            return returnFAIL(res,"密码错误");
        };
    })
});
/**
 * 查找店铺下的所有收银员员工
 */
router.post('/queryCashier',function(req,res){
    var params = req.body;
    var query={isDel:false};
    if(params.isAlternate === false){
        query.isAlternate = false;
    }

    staff.getStaffByQuery(query, {}, function (err, staffs) {
        if (err) {
            return returnFAIL(res, err.message);

        } else if (staffs && staffs.length > 0) {
            var returnList=[];

            staffs.forEach(function(item){
                if(item.role.permissionList){
                    if(item.role.permissionList.indexOf(4)!==-1 ){
                        var part={
                            _id:item._id,
                            account:item.account,
                            userName:item.userName
                        };
                        returnList.push(part);
                    }
                }
            });
            return returnSUCCESS(res,returnList);
        }else{
            return returnFAIL(res,"未搜索到员工")
        }
    })
});

module.exports = router;
