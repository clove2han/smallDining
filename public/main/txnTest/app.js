Ext.application({
    name: 'txnTest',
    
    autoCreateViewport: true,
    
    models: ['Station', 'Song'],    
    stores: ['Stations', 'RecentSongs'],
    controllers: ['Station', 'Song']
});