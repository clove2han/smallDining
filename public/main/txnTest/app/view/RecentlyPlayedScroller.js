
//Ext.define('txnTest.view.RecentlyPlayedScroller', {
//  extend: 'Ext.view.View',
//  alias: 'widget.recentlyplayedscroller',
//  itemTpl: '<div>{name}.........</div>',
//  store: 'RecentSongs'
//  //... more configuration ...
//});

//Ext.define('Json', {
//  extend: 'Ext.data.Model',
//  fields: ['name', 'email']
//});
//
//var jsonModel = Ext.create('Json', {
//  name : 'Conan'
//});
//
//var jsonStore = Ext.create('Ext.data.Store', {
//  autoLoad: true,
//  model: 'Json',
//  data : [
//    {name: 'Ed',    email: 'Spencer'}
//  ]
//});

Ext.define('txnTest.view.RecentlyPlayedScroller', {
  extend: 'Ext.form.Panel',
  alias: 'widget.recentlyplayedscroller',

//  config: {
//    myModel: jsonModel
//  },

  store: 'RecentSongs',
//  model: jsonModel,
  frame: true,
  title: '输入要发送的交易讯息',
  width: 400,
  bodyPadding: 5,

  layout: {
    type: 'vbox',
    align: 'stretch'  // Child items are stretched to full width
  },

  fieldDefaults: {
    labelAlign: 'left',
    labelWidth: 90,
    anchor: '100%'
  },

  items: [{
    xtype: 'textfield',
    id: 'textfield1ID',
    name: 'textfield1',
    fieldLabel: '交易号:',
    value: 'aaaaaa'
  }, {
    xtype: 'textareafield',
    id: 'textarea1ID',
    name: 'textarea1',
    value: 'name',
    flex: 1
  }],

//  items: [{
//    columnWidth: 0.4,
//    margin: '0 0 0 10',
//    xtype: 'fieldset',
//    title:'Company details',
//    defaults: {
//      width: 240,
//      labelWidth: 90
//    },
//    defaultType: 'textfield',
//    items: [{
//      defaultType: 'textareafield',
//      fieldLabel: 'Name',
//      name: 'name'
//    }]
//    }],
//
//  listeners: {
//    myEvent: function(model, records) {
//      if (records[0]) {
//        this.up('form').getForm().loadRecord(records[0]);
//      }
//    }
//  },

  onTxnSelect: function(selModel) {
//    Ext.Msg.alert('Form Values', textarea1ID.innerHTML);
//    var sJson = '{\n';
    var txnContent = selModel.get('txnContent');
//    Ext.iterate(txnContent, function(key, value) {
//      sJson += Ext.util.Format.format("  {0} : \"{1}\",\n", key, value);
//    });
//    sJson = sJson.substr(0, sJson.length-2);
//    sJson += '\n}';

    if (typeof JSON !== "undefined") {
      var sJson = JSON.stringify(txnContent, true, 2);
    } else {
      var sJson = Ext.JSON.encode(txnContent);
    }


//    ss = Ext.query('*[type=textareafield]');
//    for (i = 0; i < ss.length; i++) {
//      ss[i].disabled = '\"true\"';
//    }

//    Ext.getCmp('textarea1ID').inputEl.dom.innerHTML = sJson;
//    Ext.getCmp('textfield1ID').inputEl.dom.value = selModel.get('name');
    var form = this.getForm();
    form.setValues({textarea1: sJson});
    form.setValues({textfield1: selModel.get('name')})
  },

  bbar: Ext.create('Ext.toolbar.Toolbar', {
    renderTo: document.body,
    width   : 300,
    items: [
      // begin using the right-justified button container
      '->', // same as { xtype: 'tbfill' }
      '发送次数:',
      {
        xtype    : 'textfield',
        name     : 'field1',
        emptyText: 'enter send times',
        value    : '1'
      },
      { xtype: 'tbspacer', width: 10 }, // add a 50px space
      {
        //xtype: 'button', // default for Toolbars
        text: '发送',
        handler: function() {
          //this.up('form').selModel.selected.keys
          var form = this.up('form').getForm(),
            s = '';
            var json = form.getValues().textarea1;
          if (form.isValid()) {
//            Ext.iterate(form.getValues(), function(key, value) {
//              s += Ext.util.Format.format("{0} = {1}<br />", key, value);
//            }, this);
//            Ext.Msg.alert('Form Values', s);

            var message =string2json(form.getValues().textarea1);
            //alert($('#http_method').attr('value'));
            //message['_csrf'] = '<- csrf %>';
            message['http_method'] = form.getValues().textfield1;

            //数值也增加双引号
            //var message2 = string2json(JsonToString(message));
            var message2 = message;

            var times = parseInt(this.up('toolbar').items.items[2].value);
            for (var obj in message2) {

            }
            if(message2.http_method.indexOf("/") < 0){
                for(i=0; i<times; i++) {
                    SocketIOMsg.emitJsonMsg(message2);
                }
            }else{

            var jsonData = {};
            jsonData[message['http_method']] = message2;
            Ext.Ajax.request({
              url: message['http_method'],
              //jsonData: {ives: this.up('form').selModel.selected.keys.join(), message: message2},
              jsonData: json,
              success: function(response, opts) {
                var obj = Ext.decode(response.responseText);
//                Ext.Msg.alert('Form Values', '发送成功!');
                document.getElementById('SocketIOMsg-inputEl').innerHTML = response.responseText;
              },
              failure: function(response, opts) {
                console.log('server-side failure with status code ' + response.status);
              }
            });
            }
          }
        }
      }
    ]
  })

});

