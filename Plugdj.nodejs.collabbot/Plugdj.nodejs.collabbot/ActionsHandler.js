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
				self.connection.multiLine = true; // Set to true to enable multi line chat. Default is fals
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
		
		this.connection.on('advance', function(data){ self.handlerAdvance(data); });
		
		this.connection.on('vote', function(data) { self.handlerVote(data); });
    }
	
	ActionHandler.prototype.handlerAdvance = function(data){
		if (data.currentDJ && data.currentDJ.username){
			console.log(this.params.roomslug + ": Current DJ is " + data.currentDJ.username + " playing " + data.media.title);
			this.connection.sendChat("[Collab Bot] Current DJ is " + data.currentDJ.username + " playing " + data.media.title);
			this.connection.woot();
		}
		// if (data.lastPlay.dj && data.lastPlay.media){
			// console.log(this.params.roomslug + ": Previous DJ was " + data.lastPlay.dj.username + " playing " + data.lastPlay.media.title);
			// this.connection.sendChat("[Collab Bot] Previous DJ was " + data.lastPlay.dj.username + " playing " + data.lastPlay.media.title);
		// }
	}
	
	ActionHandler.prototype.handlerVote = function(data){
		let user = this.connection.getUser(data.i);
		if (!user){return;}
		console.log(this.params.roomslug + ": " + user.username + " voted " + data.v);
		if (data.v < 0){
			let media = this.connection.getMedia();
			let scores = this.connection.getRoomScore();
			this.connection.sendChat("[Collab Bot] Someone voted to pass the song " + media.title);
			//this.connection.sendChat("[Collab Bot] Vote status " + scores.negative + "/" + (scores.listeners/2));
			if (scores.negative >= (scores.listeners/2)){
				let dj = this.connection.getDJ();
				this.connection.sendChat("[Collab Bot] Majority voted to pass the DJ  " + dj.username);
				this.connection.moderateForceSkip();
			}
		}
	}
    module.exports = new ActionHandler();
})();