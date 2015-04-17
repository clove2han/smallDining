/**
 * @module       models/queue
 * @description
 * @author
 * @modified By 韩皎
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

var queueSchema = new schema({
    queueNumber    : {type: Number},     // 排队号，自动生成
    mealsNumber    : {type: Number},     // 就餐人数，非空
    tableTypeId    : {type: String},     // 台位类型ID
    tableTypeName  : {type: String},     // 排队台位类型，非空，根据就餐人数自动设定
    createDate     : {type: Date },      // 创建时间，非空，自动生成
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});
// ------ 排队验证 ------
validate.add('queueNumber',{
    required:true,
    msg: '排队号不能为空！'
});

validate.add('queueNumber',{
    exist: true,
    type: 'number',
    msg: '排队号必须为数字！'
});

validate.add('mealsNumber',{
    required:true,
    msg: '就餐人数不能为空！'
});

validate.add('mealsNumber',{
    exist: true,
    type: 'number',
    msg: '就餐人数必须为数字！'
});

validate.add('tableTypeName',{
    required:true,
    msg: '台位类型不能为空!'
});

mongooseValidateFilter.validateFilter(queueSchema, validate, filter);
mongoose.model('queue', queueSchema);
