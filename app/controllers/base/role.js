/**
 * 2014/10/14
 * @module /role/
 * @description
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router(),
    validator = require('validator'),
    role = require(PROXY).role,
    _ = require('underscore'),
    syncData=require(BASEDIR+'/tools/syncData');

/*角色添加
 *post url: /role/add
 * @param name string 角色名称
 * @param permission array 添加的权限
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': '添加成功'};
 * error:
 * {'ResultCode': 'SUCCESS', 'Result': err.message'};
 */
router.post('/add', function (req, res) {
    var params = req.body;
    params.permissionList = JSON.parse(params.permissionList);
    var newRole = deleteNull(validator,params);

    role.addRole(newRole, function (err, data) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            syncData.syncRole(data._id);
            return returnSUCCESS(res, '添加成功');
        }
    });
});

/*角色修改
 *get url: /role/update
 * @param _id string 被修改的角色_id
 * @param name string 角色名称
 * @param permission array 权限
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': '修改成功'};
 * error:
 * {'ResultCode': 'SUCCESS', 'Result': '失败信息'};
 */
router.post('/update', function (req, res) {
    var query = {},update = {};
    var params = req.body;
    query._id = validator.escape(params._id).trim();
    delete params._id;

    update = deleteNull(validator,params);
    if(update.permissionList){
        update.permissionList = JSON.parse(update.permissionList);
    }
    role.getRoleByQuery({'name': params.name, _id: {$ne:query._id}},{}, function (err, data) {
        if(err){
            return returnFAIL(res, err.message);
        }else if(data.length >0){
            return returnFAIL(res, '角色名已经在');
        }else{
            role.getRoleByQuery(query,{}, function (err, result) {
                update = _.extend(result, update);
                role.updateRole(query, update, function (err) {
                    if(err){
                        return returnFAIL(res, err.message);
                    }else{
                        syncData.syncRole(query._id);
                        return returnSUCCESS(res, '修改成功');
                    }
                });
            })
        }
    });
});

/*角色查询
 *get url: /role/query
 * @param _id string 角色_id
 * @param name string 角色名称
 * @param permission array 权限
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': roles};
 * error:
 * {'ResultCode': 'SUCCESS', 'Result': '失败信息'};
 */
router.post('/query', function (req, res) {
    var query = {},opt = {};
    query = deleteNull(validator, req.body);
    if(query.name){
        query.name = new RegExp(query.name);
    }
    if(query.permissionList){
        query.permissionList = JSON.parse(query.permissionList);
        if(query.permissionList.length > 0){
            query.permissionList = {"$all":query.permissionList};
        }else{
            delete query.permissionList;
        }
    }
    role.getRoleByQuery(query, opt, function (err, Roles) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, Roles);
        }
    });
});

/*角色查询
 *get url: /role/delete
 * @param _id string 角色_id
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': 删除成功};
 * error:
 * {'ResultCode': 'SUCCESS', 'Result': '失败信息'};
 */
router.post('/delete', function (req, res) {

    var id = validator.escape(req.body._id).trim();

    role.removeRole({_id: id}, function (err) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            syncData.syncRole(id);
            return returnSUCCESS(res, '删除成功');
        }
    });
});
module.exports = router;