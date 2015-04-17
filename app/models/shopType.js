/**
 * @module app/schema/merchant/shopType
 * @description 店铺类型数据模型
 * @author 冀玉鑫
 * @modified By
 */
var mongoose = require('mongoose'),
    schema = mongoose.Schema,
    mongooseValidateFilter = require('mongoose-validatefilter'),
    validate = new mongooseValidateFilter.validate(),
    filter = new mongooseValidateFilter.filter();

/**
 * 店铺类模型
 * @type {schema}
 */
var shopTypeSchema = new schema({
    name: {type: String}                               //店铺类型名称
    ,sort: {type: Number, default: 9999 },               //排序号
    isUpload: {type: Boolean, default: false},                      //是否上传了
    isDel: {type: Boolean, default: false}                          //是否删除了
});

shopTypeSchema.index({name: 1}, {unique: true});

// ------ 店铺类型ID修改验证 ------
validate.add('_id',{
    callback: function(value, respond) {
        value = String(value).trim().toLowerCase();
        if (this.__isUpdate || this.__isRemove) {
            this.model('shopType').findOne({
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
    msg: '没有找到对应的店铺类型！'
});

// ------ 店铺类型名称验证 ------
validate.add('name',{
    required: true,
    msg: '店铺类型名称不能为空！'
});
validate.add('name',{
    callback: function(value, respond) {
        value = String(value).trim().toLowerCase();
        if (this.__isCreate || this.__isUpdate) {
            this.model('shopType').findOne({
                name: value
            }, function(e, doc) {
                if (e) return respond(e);
                respond(!doc);
            });
        } else {
            respond(true);
        }
    },
    msg: '店铺类型名称重复！'
});
validate.add('name', {
    exist: true,
    type: 'string',
    msg: '店铺类型名称必须为字符串格式！'
});
validate.add('name', {
    exist: true,
    trim: true,
    minLength: 0,
    maxLength: 100,
    msg: '店铺类型名称长度至多为100个字符'
});

// ------ 排序号验证 ------
validate.add('sort', {
    exist: true,
    type: 'number',
    msg: '排序号必须为数值型！'
});
filter.add('sort', 'trim');

mongooseValidateFilter.validateFilter(shopTypeSchema, validate, filter);

mongoose.model('shopType', shopTypeSchema);