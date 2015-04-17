/**
 * Created with JetBrains WebStorm.
 * User: hongxin
 * Date: 13-9-6
 * Time: 下午5:48
 * To change this template use File | Settings | File Templates.
 */

(function (window) {

  var conf = {
    process_count: 1,
    site_ip: '192.168.1.111',
    table_list_count: 20
  };

  if (typeof module != 'undefined' && module.exports) {
    module.exports = conf;
  }
  else {
    window.Config = conf;
  }

})(this);
