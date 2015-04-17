Ext.define('txnTest.model.Song', {
    extend: 'Ext.data.Model',
    fields: ['id', 'name', 'played_date', 'txnContent', 'station'],

    proxy: {
        type: 'ajax',
        url: 'data/recentsongs.json',
        reader: {
            type: 'json',
            root: 'results'
        }
    }
});