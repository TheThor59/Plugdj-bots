(function () {
    'use strict';
    var PlugAPI = require('plugapi');

    function ActionHandler() {
        this.params = null;
        this.connection = null;
    }

    ActionHandler.prototype.connect = function (params, onSuccess, onFailure) {
        this.params = params;
        if (!params.user || !params.password || !params.roomslug) {
            throw new Error("Connect - Parameters not correctly provided");
        }
        let self = this;
        console.log("Connect - Starting connection process");
        new PlugAPI({
            email: this.params.user,
            password: this.params.password,
        }, function (err, connection) {
            if (err) {
                console.log("Connect - Error during connection process");
                onFailure(err);
            } else {
                console.log("Connect - Connection success, opening the room " + self.params.roomslug);
                self.connection = connection;
                self.connection.connect(self.params.roomslug);
                console.log("Connect - End of connection process");
                onSuccess();
            }
        });
    }

    ActionHandler.prototype.registerHandlers = function () {
        console.log("Register - Registring in " + this.params.roomslug);
        // Chat registration
        var self = this;
        this.connection.on('chat', function (data) {
            console.log(self.params.roomslug + ": " + data.from + "> " + data.message);
        });
    }
    module.exports = new ActionHandler();
})();