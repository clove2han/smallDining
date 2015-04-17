/**
 * 2014/10/15
 * @description 全局常量及方法
 * @author 黄耀奎
 * @modified By
 */
global.BASEDIR = __dirname;
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var tool = require(BASEDIR + '/tools/tool');
var config = require(BASEDIR + '/app/config/config');
var exceptionLog = require(BASEDIR + '/app/proxy/exceptionLog');
var constant = require(BASEDIR + '/app/config/constant').constant;

global.CONTROLLERS = BASEDIR + config.controllersDir;
global.MODELS = BASEDIR + config.modelsDir;
global.PROXY = BASEDIR + config.proxyDir;
global.constant = constant;

//global.DININGID = tool.getDiningId();
//全局返回方法
global.returnFAIL = function (res, Result) {
    if(res){
        try{
            console.log("错误信息：" + Result);
            var exception = {
                userId: "",                 //发生错误用户ID
                exception_type: "exception",//异常类型
                exception_ip: res.ip,       //异常IP
                exception_level: "3",       //异常级别
                op_type: "",                //操作类型
                exception_records: Result,  //异常记录
                createTime: Date.now()
            };
            exceptionLog.addExceptionLog(exception,function(){});
            return res.json({'ResultCode': 'FAIL', 'Result': Result});
        }catch (e){
            console.log(e);
        }
    }
};

global.returnSUCCESS = function (res, Result) {
    if(res){
        try{
            return res.json({'ResultCode': 'SUCCESS', 'Result': Result});
        }catch (e){
            console.log(e);
        }
    }
};

//删除所有值为空的键，注意数据不能实现
global.deleteNull = function (validator,dataObj) {
    for(var field in dataObj){
        if(!_.isArray(dataObj[field]) || !_.isObject(dataObj[field])){
            if(!validator.escape(dataObj[field]).trim()){
                delete dataObj[field];
            }
        }
    }

    return dataObj;
};
/**
 * 判断对象是否为空对象
 * @param obj
 * @returns {boolean}
 */
global.isEmptyObject = function(obj){
    if(obj){
        for(var n in obj){return false}
    }
    return true;
};