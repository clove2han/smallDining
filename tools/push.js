/**
 * 2015/1/10
 * @module
 * @description
 * @author 黄耀奎
 * @modified By
 */
var request = require('request'),
    url = require('url'),
    fs = require('fs'),
    _ = require('underscore'),
    tool = require(BASEDIR + '/tools/tool');
/**
 * 上传到小猫服务器
 * @param serverUrl 上传的地址
 * @param data  上传的数据
 * @param callback  回调函数
 */
function pushToSmall(serverUrl, data, callback) {

    if (tool.getDiningId() != "") {

        var smallUrl = url.resolve(tool.getSmallWalletPath(), serverUrl);
        var r = request.post(smallUrl, function (err, httpResponse, body) {
            callback(err, body);
        });

        var form = r.form();
        for (var field in data) {
            if (field == 'hasImg') {
                data['hasImg'].forEach(function (item) {
                    if(fs.existsSync(item.ImgPath)){
                        form.append(item.ImgName, fs.createReadStream(item.ImgPath));
                    }else{
                        console.log('路径不存在');
                    }
                })
            } else {
                if (_.isArray(data[field])) {
                    form.append(field, JSON.stringify(data[field]));
                }else{
                    form.append(field, data[field]);
                }

            }
        }
    }
}

function normalPushToSmall(serverUrl, data, callback) {
    if (tool.getDiningId() != "") {
        var smallUrl = url.resolve(tool.getSmallWalletPath(), serverUrl);
        request.post({url:smallUrl, form: data}, function (err, httpResponse, body) {
            callback(err, body);
        });
    }
}
exports.pushToSmall = pushToSmall;
exports.normalPushToSmall = normalPushToSmall;