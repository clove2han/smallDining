/**
 * 2014/12/2
 * @module
 * @description 供应时间段
 * @author 黄耀奎
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

//
var supplyTimeSchema = new schema({
    name: {type: String}							    //名称
    ,img: {type: String}                                //图片
    ,remark: {type: String}                     		//备注
    ,isUpload: {type: Boolean, default: false}          //是否上传了
    ,isDel: {type: Boolean, default: false}
});

supplyTimeSchema.index({name: 1}, {unique: true});

validate.add("_id", {
    callback: function (value, respond) {
        if(this.__isRemove || this.__isUpdate){
            this.model('supplyTime').findOne({
                _id: value
            }, function (e, doc) {
                if (e) return respond(e);
                if(doc){
                    respond(true);
                }else{
                    respond(false);
                }
            });
        }else{
            respond(true)
        }
    },
    msg: "对象不存在"
});

validate.add('name',{
    required: true,
    msg: '名称不能为空'
});

validate.add('name',{
    callback: function(value, respond) {
        value = String(value).trim();
        if (this.__isCreate || this.__isUpdate) {
            this.model('supplyTime').findOne({
                name: value
            }, function(e, doc) {
                if (e) return respond(e);
                respond(!doc);
            });
        } else {
            respond(true);
        }
    },
    msg: '菜品口味名称重复！'
});

mongooseValidateFilter.validateFilter(supplyTimeSchema, validate, filter);
mongoose.model('supplyTime', supplyTimeSchema);

