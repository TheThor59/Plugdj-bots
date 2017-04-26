'use strict';
var PlugAPI = require('plugapi');

var configuration = {
    user: 'pdgbot@yopmail.com',
    password: 'iamjustabot0',
    roomslug: '5013400214057541663'
}

var globalStore = {
    room: null
}

new PlugAPI({
    email: configuration.user,
    password: configuration.password,
}, function (err, bot) {
    if (!err) {
        bot.connect(configuration.roomslug);

        // Chat registration
        bot.on('chat', function (data) {
            if (data.type == 'emote')
                console.log(globalStore.room + ": " + data.from + data.message);
            else
                console.log(globalStore.room + ": " + data.from + "> " + data.message);
        });

        // Connection handling
        bot.on('roomJoin', function (room) {
            globalStore.room = room;
            console.log(globalStore.room + " joined.");
            bot.sendChat("المفاتيح العربية " + globalStore.room + ". أنا الله أكبر و إسقاط القنابل في كل غرفة بلوغج، و لأن كل ما أريد حقا هو رسالة طويلة جدا سوف يضع في الاشياء فيه. وسوف أضع الكثير من الضغط على غرفتك، أن المشرف سوف تبقي على ركل لي. اللعنة أنت");

            console.log(globalStore.room + ": Joining booth.");
            bot.joinBooth(function () {
                console.log(globalStore.room + ": Booth joined.");
            });
        });
    } else {
        console.log('Error initializing plugAPI: ' + err);
    }
});