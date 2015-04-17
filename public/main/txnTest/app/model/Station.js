Ext.define('txnTest.model.Station', {
    extend: 'Ext.data.Model',
    fields: ['id', 'name', 'date'],

    proxy: {
        type: 'ajax',
        url: 'data/stations.json',
        reader: {
            type: 'json',
            root: 'results'
        }
    }
});