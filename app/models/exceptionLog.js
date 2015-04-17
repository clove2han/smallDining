/**
 * @module app/schema/log/exceptionLog.js
 * @description 异常日志数据模型
 * @author 冀玉鑫
 * @modified By
 */

var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();


//邮件日志数据模型
var ExceptionLogSchema = new schema({
    createTime: {type: Date},           //创建时间
    userId: {type: String},             //发生错误用户ID
    exception_type: {type: String},     //异常类型
    exception_ip: {type: String},       //异常IP
    exception_level: {type: String},    //异常级别
    op_type: {type: String},            //操作类型
    exception_records: {type: String}   //异常记录
});

ExceptionLogSchema.index({createTime: 1});
ExceptionLogSchema.index({exception_level: -1});
ExceptionLogSchema.index({createTime: 1, exception_level: -1});

mongooseValidateFilter.validateFilter(ExceptionLogSchema, validate, filter);

mongoose.model('exceptionLog', ExceptionLogSchema);