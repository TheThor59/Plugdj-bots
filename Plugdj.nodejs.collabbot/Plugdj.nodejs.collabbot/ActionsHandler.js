(function () {
    'use strict';
    var PlugAPI = require('plugapi');
	var MAX_SRIKES = 3;

    function ActionHandler() {
        this.params = null;
        this.connection = null;
		this.strikes = {};
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
        console.log("Register - Registering in " + this.params.roomslug);
        // Chat registration
        var self = this;
        this.connection.on('chat', function (data) {
            console.log(self.params.roomslug + ": " + data.from + "> " + data.message);
            if (data.message && data.message.startsWith("!")){
                self.handlerCommand(data);
            }
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
				if (!this.strikes[dj.username]){
					this.strikes[dj.username] = 0;
				}
				this.strikes[dj.username] ++;
				this.connection.sendChat("[Collab Bot] user " + dj.username + " has " + this.strikes[dj.username] + " strikes over " + MAX_SRIKES);
                if (this.strikes[dj.username] >= MAX_SRIKES) {
                    this.connection.sendChat("[Collab Bot] user " + dj.username + " reached max strikes, banning him");
                    this.connection.moderateBanUser(dj.id, 4, PlugAPI.BAN.HOUR);
                    this.strikes[dj.username] = 0;
				}
			}
        }

        ActionHandler.prototype.handlerCommand = function (data) {
            var instruction = data.message.split(" ");
            var command = instruction[0];
            switch (command.toLowerCase()) {
                case "!bestof":
                    this.handlerBestOf(instruction);
                    break;
                default:
                    this.connection.sendChat("[Collab Bot] No command " + command + " available");
            }
        }

        ActionHandler.prototype.handlerBestOf = function (instruction) {
            if (instruction[1]) {
                switch (instruction[1].toLowerCase()) {
                    case "add":
                        this.handlerBestOfAdd();
                        break;
                    case "play":
                        this.handlerBestOfPlay();
                        break;
                    default:
                        this.connection.sendChat("[Collab Bot] No option " + instruction[1] + " on best of command");
                }
            } else {
                this.connection.sendChat("[Collab Bot] Usage : !bestof [ACTION], possible actions : add, play, stop");
            }
        }

        ActionHandler.prototype.handlerBestOfAdd = function () {
            var media = this.connection.getMedia();
            if (!media) {
                this.connection.sendChat("[Collab Bot] Unable to add music, nothing is playing");
                return;
            }
            var self = this;
            this.connection.grab(function () {
                self.connection.sendChat("[Collab Bot] added media " + media.title + " to best of");
            });
        }

        ActionHandler.prototype.handlerBestOfPlay = function () {
            this.connection.sendChat("[Collab Bot] starting best of collab room");
            var waitList = this.connection.getWaitList();
            for (var i = 0; i < waitList.length; i++) {
                this.connection.moderateRemoveDJ(waitList[i].id);
            }
            var dj = this.connection.getDJ();
            if (dj) {
                this.connection.moderateRemoveDJ(dj.id);
            }
            this.connection.joinBooth();
        }
	}
    module.exports = new ActionHandler();
})();