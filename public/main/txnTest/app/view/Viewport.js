Ext.define('txnTest.view.Viewport', {
    extend: 'Ext.container.Viewport',
    layout: 'fit',

    requires: [
        'txnTest.view.StationsList',
        'txnTest.view.RecentlyPlayedScroller',
        'txnTest.view.SongInfo'
    ],

    initComponent: function() {
        this.items = {
            xtype: 'panel',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            items: [{
                width: 150,
                xtype: 'panel',
                id: 'west-region',
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items: [{
                    xtype: 'stationslist',
                    flex: 1
                }]
            }, {
                xtype: 'container',
                flex: 1,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items: [{
                    xtype: 'recentlyplayedscroller',
                    height: 300
                }, {
                    xtype: 'songinfo',
                    flex: 1
                }]
            }]
        };

        this.callParent();
    }
});    