Ext.define('txnTest.view.SongInfo', {
  extend: 'Ext.container.Container',
  alias: 'widget.songinfo',
  //renderTo: 'SocketIOMsg',
  //id: 'SocketIOMsg',

  items: [{
    xtype: 'textareafield',
    id: 'SocketIOMsg',
    readOnly: true,
    width: '100%',
    height: 200
  }]

//  store: 'Songs'

//  update: function(record) {
//    var data = record ? record.data : {};
//    this.down('#songdescription').update(data);
//    this.callParent([data]);
//  }
});