
/**
 * 快餐模式
 */
var snackCtrl = CONTROLLERS + 'snack/';
module.exports = function  (app) {
	app.use('/snackCashier', require(snackCtrl+ 'cashier'));
	app.use('/snackPrepare', require(snackCtrl+ 'prepareDishes'));
	app.use('/snackGofood', require(snackCtrl+ 'gofood'));
	app.use('/snackTakeout', require(snackCtrl+ 'takeout'));
	app.use('/snackShow', require(snackCtrl+ 'show'));

};