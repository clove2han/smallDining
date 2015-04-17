var staff = require(PROXY).staff;

module.exports = function  (io, socket) {
	/**
	 * 获取所有的登录的收银端用户列表
	 * @param  {null} ) {	}         
	 * @return {json}   登录的收银端
	 */
	socket.on('getAllCashier', function () {
		socket.emit('onLineCashier', SOCKETS.cashier);
	});
	/**
	 * 保存每一端收银员对应着一个客显
	 * @param  {Object} data
	 * @return {[type]}       [description]
	 */
	socket.on('saveMate', function  (data) {
		//data = {cashierSocketId: , showSocketId}
		if (!data.cashierSocketId && !data.showSocketId) {
			return socket.emit('error', {'ResultCode': 'FAIL', 'Result': '参数不完整'});
		}else{
            var show = {showSocketId: data.showSocketId, number: data.number};
            SOCKETS.show.push(show);
            var flag = false;
            SOCKETS.cashier.forEach(function(item){
                if(item.number == data.number){
                    flag = true;
                }
            });
            if(flag){
                socket.emit('result',  {'message': 'ok'});
            }else{
                socket.emit('result',  {'message': '暂时没有可连接的收银端'});
            }
        }
    });
};
