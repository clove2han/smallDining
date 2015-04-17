/**
 * 2014/10/12.
 * @description 权限数据模型
 * @author 黄耀奎
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

var permissionSchema = new schema({
    func: {type: String},           					//功能代号
    remark: {type: String},    					        //功能描述
    path: {type: String},            					//程序路径
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});

permissionSchema.index({func: 1}, {unique: true});

//检测_id是否在在
validate.add('_id',{
    callback: function(value, respond) {
        value = String(value).trim();
        if (this.__isUpdate || this.__isRemove) {
            this.model('permission').findOne({
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
    msg: '没有找到对应的权限'
});

//添加功能代号的验证
validate.add('func',{
    required: true,
    msg: '功能代号不能为空'
});

validate.add('func', {
    type: 'string',
    msg: '功能代号必须为字符串格式'
});

validate.add('func', {
    callback: function(value, respond) {
        value = String(value).trim();
        // 这里有3个判断值，分别为：
        // __isCreate: 执行 cretaOne 时为真
        // __isUpdate: 执行 updateOne 时为真
        // __isRemove: 执行 removeOne 时为真
        if (this.__isCreate) {
            this.model('permission').findOne({
                func: value
            }, function(e, doc) {
                if (e) return respond(e);
                respond(!doc);
            });
        } else {
            respond(true);
        }
    },
    msg: '功能代号已存在'
});

//添加权限简介验证
validate.add('remark', {
    exist: true,
    type: 'string',
    msg: '权限简介为字符串格式'
});

validate.add('remark', {
    exist: true,
    maxLength: 120,
    msg: '权限简介长度不能超过120个字符'
});

//添加权限路径验证
validate.add('path', {
    required: true,
    msg: '权限路径为不能为空'
});
validate.add('path', {
    type: 'string',
    msg: '权限路径为字符串格式'
});

validate.add('path', {
    maxLength: 120,
    msg: '权限路径长度不能超过120个字符'
});

validate.add('path', {
    callback: function(value, respond) {
        value = String(value).trim();
        // 这里有3个判断值，分别为：
        // __isCreate: 执行 cretaOne 时为真
        // __isUpdate: 执行 updateOne 时为真
        // __isRemove: 执行 removeOne 时为真
        if (this.__isCreate) {
            this.model('permission').findOne({
                path: value
            }, function(e, doc) {
                if (e) return respond(e);
                respond(!doc);
            });
        } else {
            respond(true);
        }
    },
    msg: '权限路径已存在'
});

filter.add('func', 'trim');
filter.add('remark', 'trim');
filter.add('path', 'trim');

mongooseValidateFilter.validateFilter(permissionSchema, validate, filter);
mongoose.model('permission', permissionSchema);