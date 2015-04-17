
/**
 * 快餐模式
 */
var socketCtrl = BASEDIR + '/app/socketService/';
module.exports = function  (app) {
    app.use('/socket', require(socketCtrl+ 'emitQueue'));
};