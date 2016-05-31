$(function() {

    var $document = $(document);
    var $window = $(window);
    var $msg = $('.msg');
    var $chatbox = $('.chatbox');
    var $form = $('form');
    var $userNum = $('.user-no');
    var $userList = $('.users-online');
    var $userToggle = $('header > .pull, .close');

    var socket = io();

    var name;
    var userNum = 0;

    socket.on('init', function(users) {
        name = validate(prompt("Enter a username: "), users);
        socket.emit('login', name);
        userNum = users.length + 1;
        $userNum.text(userNum + ' User' + (userNum === 1 ? '' : 's'));
        $userList.append('<div class="me">' + name + '</div>');
        users.forEach(function(user) {
            $chatbox.append('<li class="notice"><span class="user">' + user + '</span> is online<li>');
            $userList.append('<div data-user="' + user + '">' + user + '</div>');
        });
        $('.loader').fadeOut(200, function() {
            this.remove();
        });
    });

    $form.submit(function() {
        var msg = $msg.val();
        if (msg !== '') {
            postMsg(msg, name, getTime());
            socket.emit('chat message', msg, name);
            $msg.val('');
        }
        return false;
    });

    socket.on('joined', function(user) {
        $chatbox.append('<li class="notice"><span class="user">' + user + '</span> connected</li>');
        $userNum.text(++userNum + ' User' + (userNum === 1 ? '' : 's'));
        $userList.append('<div data-user="' + user + '">' + user + '</div>');
        scrollDown();
    });

    socket.on('chat message', postMsg);

    socket.on('disconnect', function(user) {
        $chatbox.append('<li class="notice"><span class="user">' + user + '</span> disconnected</li>');
        $userNum.text(--userNum + ' User' + (userNum === 1 ? '' : 's'));
        $userList.children('[data-user="'+user+'"]').remove();
        scrollDown();
    });

    $userToggle.click(toggleSideBar);

    // validates username
    function validate(user, users) {
        var taken = false;
        if (user === null || !(/^[a-z0-9_-]{3,15}$/i.test(user.trim()))) {
            user = validate(prompt('Invalid username! Username can only contain letters, numbers, underscores and dashes. Minimum length: 3. Maximum length: 15'), users);
        }
        for(var i = 0; i < users.length; i++) {
            if (user === users[i]) {
                taken = true;
                break;
            }
        }
        if(taken) {
            user = validate(prompt('Username taken!'), users);
        }
        return user;
    }

    // Animation for scroll down
    function scrollDown() {
        window.scrollTo(0,document.body.scrollHeight);
    }

    // Toggles side bar
    function toggleSideBar() {
        if ($userList.css('right') === '-200px') $userList.css('right', '0px');
        else $userList.css('right', '-200px');
    }

    // Handles messages
    function postMsg(msg, user, time) {
        var $lastMsg = $chatbox.children('li').last();
        var m = $lastMsg.children('.name').text();
        if (m === user || ($lastMsg.hasClass('mine') && user === name)) {
            var t = $lastMsg.children('.time').last().text();
            if (t === time)
                $lastMsg.children('.bubble').last().after('<br><div class="bubble"></div>');
            else
                $lastMsg.children('.time').last().after('<div class="bubble"></div><span class="time">' + time + '</span>');
            $lastMsg.children('.bubble').last().text(msg);
        } else {
            m = '<li';
            if (user===name) m += ' class="mine">';
            else m += '><span class="name">'+user+'</span>';
            m += '<div class="bubble"></div><span class="time">'+time+'</span></li>';
            $chatbox.append(m);
            $lastMsg = $chatbox.children('li').last();
            $lastMsg.children('.bubble').text(msg);
        }
        scrollDown();
    }

    // Gets current time
    function getTime() {
        var time = new Date();
        var hours = time.getHours();
        var minutes = time.getMinutes();
        if (hours < 10) hours = '0' + hours;
        if (minutes < 10) minutes = '0' + minutes;
        return hours + ':' + minutes;
    }

});
