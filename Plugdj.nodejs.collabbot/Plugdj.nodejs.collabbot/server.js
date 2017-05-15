(function () {
    'use strict';
    var ActionsHandler = require('./ActionsHandler.js');


    var configuration = {
        user: 'plugbot',
        password: '',
        roomslug: ''
    }

    ActionsHandler.connect(configuration, function () {
        //Success
        ActionsHandler.registerHandlers();
    },
    function() {
    });

})();

//            bot.sendChat("Collab Bot is started");




//            //Join the booth
//            //console.log(globalStore.room + ": Joining booth.");
//            //bot.joinBooth(function () {
//            //    console.log(globalStore.room + ": Booth joined.");
//            //});
