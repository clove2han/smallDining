/**
 * 2014/10/13
 * @module /permission/
 * @description 权限的所有路由
 * @author 黄耀奎
 * @modified By
 */
var router = require('express').Router(),
    validator = require('validator'),
    permission = require(PROXY).permission;

/*权限添加
 *post url: /permission/add
 * @param func: 权限代号
 * @param description: 描述
 * @param path: 权限路径
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': '添加成功'};
 * error: {'ResultCode': 'FALL', 'Result': 失败信息};
 */
router.get('/add', function (req, res) {
       res.end('permission');
}).post('/add', function (req, res) {

       var newPermission = deleteNull(validator, req.body);

       permission.addPermission(newPermission, function (err, data) {
           if(err){
               return returnFAIL(res, err.message);
           }else{
               return returnSUCCESS(res, '添加成功');
           }
       })
});

/*权限修改
 *post url: /permission/update
 * @param id: 被修改的_id
 * @param func: 权限代号
 * @param description: 描述
 * @param path: 权限路径
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': '修改成功'};
 * error:
 * {'ResultCode': 'SUCCESS', 'Result': '失败信息'};
 * id为不在在时：{'ResultCode': 'FALL', 'Result': 缺少修改的对象};
 */
router.get('/update', function (req, res) {

    res.render('permission-update');
}).post('/update', function (req, res) {

    var query  = {},
        update = {};

    var id = validator.escape(req.body._id);
    var func = validator.escape(req.body.func);
    var description = validator.escape(req.body.description);
    var path = validator.escape(req.body.path);

    permission.getPermissionByQuery({func:func, _id:{$ne:id}}, {}, function (err, data) {
        if(err){
            return returnFAIL(res, err.message);
        }else if(data.length >0){
            return returnFAIL(res, '权限代号已经在在');
        }else{
            if(id.length <= 0){
                return returnFAIL(res, '缺少修改的对象');
            }else{
                query = {_id: id};
            }
            if(func.length > 0){
                update.func = func;
            }
            if(description.length > 0){
                update.description = description;
            }
            if(path.length > 0){
                update.path = path;
            }

            permission.updatePermission(query, update, function (err, data) {
                if(err){
                    return returnFAIL(res, err.message);
                }else{
                    return returnSUCCESS(res, '修改成功');
                }
            });
        }
    });

});

/*权限列表
 *get url: /permission/update
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': permissions};
 * error:
 * {'ResultCode': 'SUCCESS', 'Result': '失败信息'};
 */
router.get('/query', function (req, res) {

    permission.getPermissionByQuery({},{}, function (err, permissions) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, permissions);
        }
    });
}).post('/query', function (req, res) {

    query = deleteNull(validator, req.body);

    permission.getPermissionByQuery(query, {}, function (err, permissions) {
        if(err){
            return returnFAIL(res, err.message);
        }else{
            return returnSUCCESS(res, permissions);
        }
    })
});

/*权限删除
 *get url: /permission/delete
 * @param _id string 被删除的权限
 * @return
 * success : {'ResultCode': 'SUCCESS', 'Result': '删除成功'};
 * error:
 * {'ResultCode': 'SUCCESS', 'Result': '失败信息'};
 */
router.post('/delete', function (req, res) {
    var query = {};

    var id = validator.escape(req.body._id).trim();

    if(id.length <= 0){
        return returnFunc(res, 'FALL', '缺少修改的对象');
    }else{
        query = {_id: id};
        permission.removePermission(query, function (err, data) {
            if(err){
                return returnFAIL(res, err.message);
            }else{
                return returnSUCCESS(res, '删除成功');
            }
        });
    }
});

module.exports = router;