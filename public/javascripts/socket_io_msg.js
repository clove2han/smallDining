/**
 * Created with JetBrains WebStorm.
 * User: hongxin
 * Date: 13-4-7
 * Time: 下午2:34
 * To change this template use File | Settings | File Templates.
 */

function string2json(strJson){
  try {
    var j = "(" + strJson + ")"; // 用括号将json字符串括起来
    return eval(j); // 返回json对象
  } catch (e) {
    return null;
  }
}

function JsonToString(o) {
  var arr = [];
  var fmt = function(s) {
    //if (typeof s == 'object' && s != null) return JsonToStr(s);
    return /^(string|number|array)$/.test(typeof s) ? '"' + s + '"' : s;
  };
  for (var i in o)
    arr.push('"' + i + '":' + fmt(o[i]));
  return '{' + arr.join(',') + '}';
}

//(function (window) {
var SocketIOMsg = {
  socket: null,
  firstconnect: true,

  connect: function () {
    if(SocketIOMsg.firstconnect) {
      //console.log(Config.process_count);
      var sio_id = Math.floor(Math.random()*Config.process_count);
      //sio_id --;
      //console.log(sio_id);
      SocketIOMsg.socket = io.connect('http://' + Config.site_ip + ':800' + sio_id);

      SocketIOMsg.socket.on('message', function(data){ SocketIOMsg.message(data); });
      SocketIOMsg.socket.on('connect', function(){ SocketIOMsg.status_update("Connected to Server"); });
      SocketIOMsg.socket.on('disconnect', function(){ SocketIOMsg.status_update("Disconnected from Server"); });
      SocketIOMsg.socket.on('reconnect', function(){ SocketIOMsg.status_update("Reconnected to Server"); });
      SocketIOMsg.socket.on('reconnecting', function( nextRetry ){ SocketIOMsg.status_update("Reconnecting in "
        + nextRetry + " seconds"); });
      SocketIOMsg.socket.on('reconnect_failed', function(){ SocketIOMsg.message("Reconnect Failed"); });

      SocketIOMsg.socket.on('ready', function () {
        SocketIOMsg.status_update("ready!");
        //socket.emit('msg', confirm('What is your message?'));
        SocketIOMsg.socket.emit('msg', 'What is your message?');
      });

        SocketIOMsg.socket.on('svr_emit', function(data){
            SocketIOMsg.message(JsonToString(data));
        });

        //获取菜品状态
        SocketIOMsg.socket.on('getFoodState', function(data){
            SocketIOMsg.message(JsonToString(data));
        });
        //获取新增的菜品信息
        SocketIOMsg.socket.on('getDishesOrder', function(data){
            SocketIOMsg.message(JsonToString(data));
        });

      SocketIOMsg.firstconnect = false;
    } else {
      SocketIOMsg.socket.socket.reconnect();
    }
  },

  disconnect: function() {
    SocketIOMsg.socket.disconnect();
  },

  message: function (data) {
//    document.getElementById('SocketIOMsg').innerHTML = data;
      document.getElementById('SocketIOMsg-inputEl').innerHTML = data;
//    document.getElementById('SocketIOMsg-inputEl').innerHTML = JSON.stringify(JSON.parse(data), true, 2);

    //parent.parent.loadMark(data);
  },

//  svr_emit: function (user, txt){
//    document.getElementById('SocketIOMsg-inputEl').innerHTML = txt;
//  },

  status_update: function (user, txt){
    //document.getElementById('status').innerHTML = txt;
  },

//function esc(msg){
//  return msg.replace(/</g, '<').replace(/>/g, '>');
//}
//

  setPhoneNo: function (PhoneNo) {
    SocketIOMsg.socket.emit('setPhoneNo', {PhoneNo: PhoneNo});
  },

  emitJsonMsg: function (json) {
    SocketIOMsg.socket.emit(json.http_method, json);
  }

};


//})(this);