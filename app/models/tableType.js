/**
 * @module        models/tableType
 * @description  台位类型表
 * @author        韩皎
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

/* ***********************
 * 表名:台位类型表 tableType
 * **********************/
var tableTypeSchema = new schema({
    name   :{type:String,unique:true},      //类型名称
    sort   :{type:Number, default: 1},                   //显示顺序
    number :{type:Number},                   //可坐人数
    state  :{type:Boolean,default:true},     //状态
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});

tableTypeSchema.index({name:1});
tableTypeSchema.index({sort:1});

// ------ 类型验证 ------
validate.add('name',{
    required: true,
    msg: '名称不能为空！'
});

// ------ 排序号验证 ------
validate.add('sort', {
    exist: true,
    type: 'number',
    msg: '排序号必须为数值型！'
});

validate.add('number',{
    required: true,
    msg: '可坐人数不能为空！'
});

// ------ 可坐人数 ------
validate.add('number', {
    exist: true,
    type: 'number',
    msg: '可坐人数必须为数值型！'
});

//台位类型添加验证
validate.add('name',{
    callback: function(value, respond) {
        value = String(value).trim();
        if (this.__isCreate) {
            this.model('tableType').findOne({
                name: value
            }, function(e, doc) {
                if (e) return respond(e);
                return respond(!doc);
            });
        } else {
            return respond(true);
        }
    },
    msg: '台位类型名称重复！'
});

mongooseValidateFilter.validateFilter(tableTypeSchema, validate, filter);
mongoose.model('tableType', tableTypeSchema);