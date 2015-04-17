Ext.define('txnTest.store.RecentSongs', {
    extend: 'Ext.data.Store',
    model: 'txnTest.model.Song',

    // Make sure to require your model if you are
    // not using Ext JS 4.0.5
    requires: 'txnTest.model.Song'
});