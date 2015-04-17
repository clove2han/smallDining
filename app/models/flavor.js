/**
 * 2014/10/12
 * @module models/flavor
 * @description 菜品口味数据模型
 * @author 冀玉鑫
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

//口味表
var flavorSchema = new schema({
    name: {type: String}							    //名称
    ,remark: {type: String},                     		//备注
    isDel: {type: Boolean, default: false} ,            //是否删除了
    isUpload: {type: Boolean, default: false}           //是否上传了

});

// ------ 菜品类型ID修改验证 ------
validate.add('_id',{
    callback: function(value, respond) {
        value = String(value).trim().toLowerCase();
        if (this.__isUpdate || this.__isRemove) {
            this.model('flavor').findOne({
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
    msg: '没有找到对应的菜品口味！'
});
// ------ 口味名称验证 ------
validate.add('name',{
    required: true,
    msg: '口味名称不能为空！'
});

validate.add('name',{
    callback: function(value, respond) {
        value = String(value).trim().toLowerCase();
        if (this.__isCreate || this.__isUpdate) {
            this.model('flavor').findOne({
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
flavorSchema.index({name: 1}, {unique: true});

mongooseValidateFilter.validateFilter(flavorSchema, validate, filter);
mongoose.model('flavor', flavorSchema);