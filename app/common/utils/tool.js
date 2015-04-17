/**
 * 2014/10/29
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
//删除所有值为空的键，注意数据不能实现
var moment = require('moment'),
    utils = require('utility'),
    path = require('path'),
    fs = require('fs'),
    shop = require(BASEDIR + '/app/config/shop.json'),
    _ = require('underscore');

//    config = require(BASEDIR + '/config/config.json')
if (fs.existsSync(BASEDIR + '/app/config/config.json')) {
    var config = require(BASEDIR + '/app/config/config.json');
} else {
    console.log(BASEDIR + '/app/config/config.json 配置文件不存在，程序无法运行');
}

/**
 * 创建订单号
 * @return {string} 订单号
 */
function createOrderNumber() {
    return moment().format('YYYYMMDDHHmmss') + utils.randomString(4, '0123456789');
}

/**
 * 重命名图片
 * @return {string} 图片名
 */
function rePicName() {
    return moment().format('YYYYMMDDHHmmss') + utils.randomString(8, '0123456789');
}

/**
 * 删除值为空的字段
 * @param  {object} validator       validator工具对象
 * @param  {array|json} dataObj     需要初删除空值的数组
 * @return {array|json}             返回删除后的内容
 */
function deleteNull(validator, dataObj) {
    for (var field in dataObj) {
        if (!_.isArray(dataObj[field]) || !_.isObject(dataObj[field])) {
            if (!validator.escape(dataObj[field]).trim()) {
                delete dataObj[field];
            }
        }
    }

    return dataObj;
}


//重命名
function renameImg(filename) {
    var fileExt = path.extname(filename);
    var prName = rePicName();
    return prName + fileExt;
}

//后缀名
function extName(filename) {
    return path.extname(filename);
}

//移动上传文件并删除临时文件
/**
 * 移动上传文件并删除临时文件
 * @param  {strint} oldFilePath 移动前的文件目录地址
 * @param  {string} newFilePath 目的地的地址
 * @return {boolean}            返回结果
 */
function moveAndDel(oldFilePath, newFilePath) {
    fs.rename(oldFilePath, newFilePath, function (err) {
        var isSuccess = false;

        if (err) {
            isSuccess = false;
        } else {
            isSuccess = true;
            fs.unlink(oldFilePath, function (err) {

            });
        }
        return isSuccess;
    });
}

/**
 * 移动文件
 * @param oldPath
 * @param newPath
 * @returns {*}
 */
function moveAndDelSync(oldPath, newPath) {
    return fs.renameSync(oldPath, newPath);
}

function delFile(path) {
    fs.unlink(path, function (err) {
        if (err) {
            return false;
        } else {
            return true;
        }
    });
}
/**
 * 判断是否为图片
 * @param filePath      ：  文件的路径或文件名称
 * @returns {boolean}   :   true/false
 */
function isImg(filePath) {
    console.log(filePath);
    /** 定义图片的格式 */
    var img_ext = ['.jpg', '.png', '.bmp', '.jpeg'];

    //得到文件类型名
    var file_ext = path.extname(filePath);
    var flag = false;
    //判断文件类型是否为图片
    if (img_ext.indexOf(file_ext) >= 0) {
        flag = true;
    }
    return flag;
}

/*
 * 判断对象是否为空
 * */

function isObjectEmpty(obj) {
    if (typeof obj != "object") {
        throw "parameter type error !!!"
    }
    for (var x in obj) {
        if (obj[x]) {
            return false;
        }
    }
    return true;
}

/**
 * 判断字符串是否为空
 * @param obj
 */
function isNull(obj){
    var flag = true;
    if(obj!==null && (obj!="" || obj === 0) && typeof(obj)!=="undefined"){
        flag = false;
    }
    return flag;
}

/*
 * 获取小猫入驻后的分配的唯一餐厅编号
 * */
function getDiningId() {
    return config.diningId;
}

/*
 * 获取小猫入驻后的分配的唯一餐厅编号
 * */
function setDiningId(json, callback) {
    json = JSON.stringify(json);
    fs.writeFile(BASEDIR + '/app/config/config.json', json, function (err) {
        callback(err);
    });
}

/*
 * 验证是否登录
 * */
function authorize(req, res, next) {
    if (!req.session.user_id) {
        res.redirect('/config/login');
    } else {
        next();
    }
}

/**
 * 强制截取小数点的后一位
 * @param number
 */
function toDecimal1(number) {

    //if(utils.isNumber(number)){
    return Math.round(number * Math.pow(10, 1)) / Math.pow(10, 1)
    //}

    /*var string = number.toString();
     var index = string.indexOf('.');
     if(index != -1){
     var newNumber = string.substring(0,(index+2));
     return newNumber;
     }else{
     return number;
     }*/

}
/**
 *
 * @returns {config.diningId|*}
 */
function getSmallWalletPath() {
    return config.smallWallet;
}

/**
 * 设定时间执行
 * @param obj
 * @param callback
 * @param timeout
 */
function wait() {
    //刻意等待mils的时间，mils的单位是毫秒。
    var mils = arguments[0] && 1000;
    var now = new Date;
    while (new Date - now <= mils);
}

function fire(obj, callback, timeout) {
    //直接将obj的内容返回给async
    timeout = timeout || 1000;
    setTimeout(function () {
        callback(null, obj);
    }, timeout);
}


/**
 * 判断是否是json格式字符串，不能用来判断json
 * @param obj string
 * @returns {boolean}
 */
function isJson(obj) {
    try {
        JSON.parse(obj);
    } catch (e) {
        return false;
    }
    return true;
    /*var isjson = typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
     return isjson;*/
}

/**
 * 判断对象是否有toJSON()这个方法
 * @param obj
 * @returns {boolean}
 */
function hasToJson(obj) {
    var result = true;
    try {
        obj.toJSON();
    } catch (e) {
        result = false;
    }
    return result;
}

/**
 * 设置配置文件餐厅图片本地地址
 * @param json
 * @param callback
 */
function setImgName(json, callback) {
    json = JSON.stringify(json);
    fs.writeFile(BASEDIR + '/app/config/config.json', json, function (err) {
        callback(err);
    });
}

/**
 * 获得餐厅的本地图片
 * @returns config.imgName
 */
function getImgName() {
    return config.imgName;
}

/**
 * 是否是数组
 * @param obj
 * @returns {bool}
 */
function isArray(obj) {
    return _.isArray(obj);
}

function getAccount() {
    return config.account;
}
function getPassword() {
    return config.password;
}

/**
 * 数组按内部指定字段排序
 * @param order     排序顺序 asc:升序 desc:降序
 * @param sortBy    字段名
 * @returns {Function}
 * DEMO:    bills.sort(getSortFun('desc', 'createTime'));
 */
function getSortArray(order, sortBy) {
    var ordALPath = (order == 'asc') ? '>' : '<';
    return new Function('a', 'b', 'return a.' + sortBy + ordALPath + 'b.' + sortBy + '?1:-1');
}
/**
 * 保留两位小数
 * @param number
 * @returns {number}
 */
function toDecimal1Two(number) {
    var f = parseFloat(number);
    if (isNaN(f)) {
        return;
    }
    f = Math.round(f*100)/100;
    return f;
}

/**
 * 获得餐厅系统模式
 */
function getPattern() {
    return config.pattern;
}
/**
 * 判断一个字符串是否存在list中
 * 存在返回索引
 * 不存在返回-1
 */
function returnIndex(someString,aList){
    if(aList.length>0){
        for(var i=0;i<aList.length;i++){
            if(aList[i] == someString){
                return i;
            }
        }
        return -1;
    }else{
        return -1
    }
};

exports.createOrderNumber = createOrderNumber;
exports.rePicName = rePicName;
exports.deleteNull = deleteNull;
exports.renameImg = renameImg;
exports.moveAndDel = moveAndDel;
exports.isImg = isImg;
exports.isObjectEmpty = isObjectEmpty;
exports.getDiningId = getDiningId;
exports.setDiningId = setDiningId;
exports.authorize = authorize;
exports.toDecimal1 = toDecimal1;
exports.getSmallWalletPath = getSmallWalletPath;
exports.extName = extName;
exports.moveAndDelSync = moveAndDelSync;
exports.delFile = delFile;
exports.wait = wait;
exports.fire = fire;
exports.isJson = isJson;
exports.getImgName = getImgName;
exports.setImgName = setImgName;
exports.hasToJson = hasToJson;
exports.isArray = isArray;
exports.getAccount = getAccount;
exports.getPassword = getPassword;
exports.toDecimal1Two = toDecimal1Two;
exports.getPattern = getPattern;
exports.getSortArray = getSortArray;
exports.returnIndex=returnIndex;
exports.isNull=isNull;
