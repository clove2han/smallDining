/**
 * 2014/10/12
 * @description 角色数据模型
 * @author 黄耀奎
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter(),
    _ = require('underscore');

var permission = [1,2,3,4,5,6]; //1:表示迎宾,2:服务员,3:厨师,4:收银员,5:业务管理员,6:店长

var roleSchema = new schema({
    name: {type: String},                       		//角色名称
    permissionList: [{type: Number}],                    //权限列表
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});
roleSchema.index({name: 1}, {unique: true});

validate.add('_id', {
    callback: function (value, respond) {
        value = String(value).trim();
        if (this.__isUpdate || this.__isRemove) {
            this.model('role').findOne({
                _id: value
            }, function(e, doc) {
                if (e) return respond(e);
                if(doc){
                    respond(true);
                }else{
                    respond(false);
                }
            });
        } else {
            respond(true);
        }
    },
    msg: '角色不存在'
});


//添加角色名称的验证
validate.add('name',{
    required: true,
    msg: '角色名称不能为空'
});

validate.add('name', {
    type: 'string',
    msg: '角色名称必须为字符串格式'
});

validate.add('name', {
    callback: function(value, respond) {
        value = String(value).trim();
        // 这里有3个判断值，分别为：
        // __isCreate: 执行 cretaOne 时为真
        // __isUpdate: 执行 updateOne 时为真
        // __isRemove: 执行 removeOne 时为真
        if (this.__isCreate) {
            this.model('role').findOne({
                name: value
            }, function(e, doc) {
                if (e) return respond(e);
                respond(!doc);
            });
        } else {
            respond(true);
        }
    },
    msg: '角色名称已存在'
});

validate.add('permissionList', {
    callback: function (value, respond) {
        if(_.isArray(value)){
            value = _.uniq(value);
            for(var i = value.length-1; i >= 0; i--){
                if(_.indexOf(permission, value[i]) == -1){
                    return respond(false);
                }
            }
            return respond(true);
        }else{
            return respond(false);
        }
    },
    msg: '权限有误'
});

filter.add('name', 'trim');

mongooseValidateFilter.validateFilter(roleSchema, validate, filter);
mongoose.model('role', roleSchema);