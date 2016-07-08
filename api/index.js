var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var port = process.env.PORT || 5000;

app.listen(port, function() {
  console.log('Chat online at *:'+port);
});


function handler (req, res, err) {
  if (err) throw err;
  res.writeHead(301, {
    'Location': 'https://polechat.tk/'
  });
  res.end();
}

// Chat
var time;
var users = [];
var i;

io.on('connection', function(socket) {

  socket.emit('init', users);

  socket.on('login', function(user) {

    if (!/^[a-z0-9_-]{3,15}$/i.test(user)) {
      socket.emit('invalid username');
      return;
    }
    for (var i = 0; i < users.length; i++) {
      if (users[i] === user) {
        socket.emit('username taken');
        return;
      }
    }

    socket.emit('login successfull');

    socket.username = user;
    users.push(socket.username);
    time = getTime();
    console.log('['+time+'] '+user+' connected');

    socket.broadcast.emit('joined', user);

    socket.on('chat message', function(msg, user) {
      time = getTime();
      console.log('['+time+'] '+user+': '+msg);
      socket.broadcast.emit('chat message', msg, user);
    });

    socket.on('started typing', function(user) {
      i = users.indexOf(socket.username);
      users[i].typing = true;
      time = getTime();
      console.log('['+time+'] '+user+' started typing...');
      socket.broadcast.emit('started typing', user);
    });

    socket.on('ended typing', function(user) {
      i = users.indexOf(socket.username);
      users[i].typing = false;
      time = getTime();
      console.log('['+time+'] '+user+' ended typing');
      socket.broadcast.emit('ended typing', user);
    });

    socket.on('disconnect', function() {
      i = users.indexOf(socket.username);
      if (users[i].typing)
        io.emit('ended typing', user);
      users.splice(i, 1);
      time = getTime();
      console.log('['+time+'] '+socket.username+' disconnected');
      io.emit('disconnect', socket.username);
    });
  });


});

function getTime() {
  var time = new Date();
  var hours = time.getHours();
  var minutes = time.getMinutes();
  if (hours < 10) hours = '0' + hours;
  if (minutes < 10) minutes = '0' + minutes;
  return hours + ':' + minutes;
}
