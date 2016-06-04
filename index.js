var compression = require('compression');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

app.use(compression());
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('index');
});

app.use(function(req, res, next) {
    res.status(404).render('error', {
        code: '404',
        message: 'There\'s nothing here.'
    });
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('error', {
        code: '500',
        message: 'A pole is stuck in our system. Please check back later.'
    });
});

// Chat
var time;
var users = [];
var i;

io.on('connection', function(socket) {

    socket.emit('init', users);

    socket.on('login', function(user) {
        socket.username = user;
        users.push(socket.username);
        time = getTime();
        console.log('['+time+'] '+user+' connected');

        socket.broadcast.emit('joined', user);

        socket.on('chat message', function(msg, user) {
            time = getTime();
            console.log('['+time+'] '+user+': '+msg);
            socket.broadcast.emit('chat message', msg, user, time);
        });

        socket.on('disconnect', function() {
            i = users.indexOf(socket.username);
            users.splice(i, 1);
            time = getTime();
            console.log('['+time+'] '+socket.username+' disconnected');
            io.emit('disconnect', socket.username);
        });
    });


});

server.listen(port, function(){
    console.log('Chat online at *:'+port);
});

function getTime() {
    var time = new Date();
    var hours = time.getHours();
    var minutes = time.getMinutes();
    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;
    return hours + ':' + minutes;
}
