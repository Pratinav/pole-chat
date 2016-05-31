$(function() {

    var $document = $(document);
    var $window = $(window);
    var $body = $('html, body');
    var $msg = $('.msg');
    var $chatbox = $('.chatbox');
    var $form = $('form');
    var $userNum = $('.user-no');
    var $userList = $('.users-online');
    var $userToggle = $('header > span, .close');

    var socket = io();

    var name;
    var userNum = 0;

    socket.on('init', function(users) {
        name = validate(prompt("Enter a username: "), users);
        socket.emit('login', name);
        userNum = users.length;
        $userNum.text(userNum + ' User' + (userNum === 1 ? '' : 's'));
        $userList.append($('<div class="me">').text(name));
        users.forEach(function(user) {
            if (user !== name) {
                $chatbox.append($('<li class="notice">').html('<span class="user">'+user+'</span> is online').fadeIn(200));
                $userList.append($('<div class="' + user + '">').text(user));
            }
        });
        $('.loader').fadeOut(200, function() {
            this.remove();
        });
    });

    $form.submit(function() {
        var msg = $msg.val();
        if (msg === '') return false;
        socket.emit('chat message', msg, name);
        $msg.val('');
        return false;
    });

    socket.on('joined', function(user, time) {
        $chatbox.append($('<li class="notice">').html(time+' <span class="user">'+user+'</span> connected').fadeIn(200));
        $userNum.text(++userNum + ' User' + (userNum === 1 ? '' : 's'));
        if (user !== name) $userList.append($('<div data-user="' + user + '">').text(user));
        scrollDown();
    });

    socket.on('chat message', function(msg, user, time) {
        var $lastMsg = $chatbox.children('li').last();
        var m = $lastMsg.children('.name').text();
        if (m === user || ($lastMsg.hasClass('mine') && user === name)) {
            $lastMsg.children('.bubble').last().after('<br><div class="bubble same"></div>');
            $lastMsg.children('.bubble').last().text(msg).fadeIn(200).css('display', 'inline-block');
            $lastMsg.children('.time').text(time);
        } else {
            m = '<li';
            if (user===name) m +=' class="mine">';
            else m += '><span class="name">'+user+'</span>';
            m +='<div class="bubble"></div><span class="time">'+time+'</span></li>';
            $chatbox.append(m);
            $lastMsg = $chatbox.children('li').last();
            $lastMsg.children('.bubble').text(msg);
            $lastMsg.fadeIn(200);
        }
        scrollDown();
    });

    socket.on('disconnect', function(user, time) {
        $chatbox.append($('<li class="notice">').html(time+' <span class="user">'+user+'</span> disconnected').fadeIn(200));
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
        $body.animate({
            scrollTop: $document.height()-$window.height()
        }, 200);
    }

    // Toggles side bar
    function toggleSideBar() {
        if ($userList.css('right') === '-200px') $userList.css('right', '0px');
        else $userList.css('right', '-200px');
    }

});
