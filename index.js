var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.argv[2] || 3000;

// Routing
app.use(express.static(__dirname + '/public'));

// Chat
var time;
var users = [];
var i;

io.on('connection', function(socket) {

    io.to(socket.id).emit('init', users);

    socket.on('login', function(user) {
        socket.username = user;
        users.push(socket.username);
        time = getTime();
        console.log('['+time+'] '+user+' connected');

        io.emit('joined', user, time);

        socket.on('chat message', function(msg, user) {
            time = getTime();
            console.log('['+time+'] '+user+': '+msg);
            io.emit('chat message', msg, user, time);
        });

        socket.on('disconnect', function() {
            i = users.indexOf(socket.username);
            users.splice(i, 1);
            time = getTime();
            console.log('['+time+'] '+socket.username+' disconnected');
            io.emit('disconnect', socket.username, time);
        });
    });


});

server.listen(port, '0.0.0.0', function(){
    console.log('Chat online at *:'+port);
});

function getTime() {
    var time = new Date();
    var hours = time.getHours();
    var minutes = time.getMinutes();
    if (hours<10) hours = '0'+hours;
    if (minutes<10) minutes = '0'+minutes;
    return hours+':'+minutes;
}
