window.onload = function() {

    var socket = io();
    var init = false;
    var spinnerEl = document.querySelector('.spinner__container');
    var loginWrapperEl = document.querySelector('.login-wrapper');
    var loginFormEl = document.querySelector('.login');
    var loginInputEl = document.querySelector('.login-input');
    var usernameInvalidEl = document.querySelector('.username-invalid');
    var usernameTakenEl = document.querySelector('.username-taken');
    var usersOnlineEl = document.querySelector('.users-online');
    var userNumEl = document.querySelectorAll('.user-no');
    var chatBoxEl = document.querySelector('.chatbox');
    var messageFormEl = document.querySelector('.send-msg form');
    var messageInputEl = document.querySelector('.msg');
    var openSideBarEl = document.querySelector('.pull');
    var closeSideBarEl = document.querySelector('.close');
    var username;
    var users;
    var isTyping = false;
    var lastTimeout;

    loginFormEl.addEventListener('submit', onLogin);
    messageFormEl.addEventListener('submit', onMessage);
    openSideBarEl.addEventListener('click', toggleSideBar);
    closeSideBarEl.addEventListener('click', toggleSideBar);
    messageInputEl.onkeydown = onTyping;

    socket.on('init', onInit);
    socket.on('joined', postNotice);
    socket.on('disconnect', postNotice);
    socket.on('chat message', postMessage);
    socket.on('started typing', onStartedTyping);
    socket.on('ended typing', onEndedTyping);

    function onLogin(evt) {
        evt.preventDefault();
        if (!init) return;
        username = loginInputEl.value.trim();
        if (!validateUsername())
            return;

        users.push(username);
        socket.emit('login', username);

        updateUserNum(users.length);
        var meEl = document.querySelector('.me');
        meEl.appendChild(document.createTextNode(username));
        meEl.style.display = 'block';

        loginWrapperEl.addEventListener('transitionend', function(evt) {
            loginWrapperEl.parentNode.removeChild(loginWrapperEl);
            loginWrapperEl.removeEventListener('transitionend', this);
        });
        loginWrapperEl.classList.add('login-wrapper--disabled');

        loginFormEl.removeEventListener('submit', onLogin);
    }

    function validateUsername() {
        if (!/^[a-z0-9_-]{3,15}$/i.test(username)) {
            if (usernameTakenEl.style.display === 'block')
                usernameTakenEl.style.display = 'none';
            if (usernameInvalidEl.style.display === 'none' || !usernameInvalidEl.style.display)
                usernameInvalidEl.style.display = 'block';
            return false;
        }
        if (usernameInvalidEl.style.display === 'block')
                usernameInvalidEl.style.display = 'none';
        var usernameTaken = false;
        for (var i = 0; i < users.length; i++) {
            if (users[i] === username) {
                usernameTaken = true;
                break;
            }
        }
        if (usernameTaken) {
            if (usernameTakenEl.style.display === 'none' || !usernameTakenEl.style.display)
                usernameTakenEl.style.display = 'block';
            return false;
        }
        if (usernameTakenEl.style.display === 'block')
            usernameTakenEl.style.display = 'none';
        return true;
    }

    function onInit(existingUsers) {
        init = true;
        users = existingUsers;
        updateUserNum(users.length);
        users.forEach(function(user) {
            var newUserListEl = document.createElement('div');
            newUserListEl.setAttribute('data-user', user);
            var newUsername = document.createTextNode(user);
            newUserListEl.appendChild(newUsername);
            usersOnlineEl.appendChild(newUserListEl);
        });
        spinnerEl.addEventListener('transitionend', function(evt) {
            spinnerEl.parentNode.removeChild(spinnerEl);
            spinnerEl.removeEventListener('transitionend', this);
        });
        spinnerEl.classList.add('spinner__container--disabled');
    }

    function onTyping(evt) {
        if (!messageInputEl.value) return;
        if (!isTyping) {
            isTyping = true;
            socket.emit('started typing', username);
        }
        if (lastTimeout)
            clearTimeout(lastTimeout);
        lastTimeout = setTimeout(function() {
            isTyping = false;
            socket.emit('ended typing', username);
        }, 2000);
    }

    function onStartedTyping(user) {
        var newBubbleEl = document.createElement('div');
        newBubbleEl.classList.add('bubble');
        newBubbleEl.classList.add('typing-indicator');
        newBubbleEl.innerHTML = '<span></span><span></span><span></span>';
        var lastMessageEl = chatBoxEl.querySelectorAll('li');
        lastMessageEl = lastMessageEl[lastMessageEl.length - 1];
        if (lastMessageEl && lastMessageEl.getAttribute('data-user') === user) {
            lastMessageEl.appendChild(newBubbleEl);
            return;
        }
        var newMessageEl = document.createElement('li');
        newMessageEl.setAttribute('data-user', user);
        newMessageEl.setAttribute('data-typing', 'true');
        var newUserEl = document.createElement('span');
        newUserEl.classList.add('name');
        newUserEl.appendChild(document.createTextNode(user));
        newMessageEl.appendChild(newUserEl);
        newMessageEl.appendChild(newBubbleEl);
        chatBoxEl.appendChild(newMessageEl);
    }

    function onEndedTyping(user) {
        var messageEl = document.querySelectorAll('li[data-user="' + user + '"]');
        messageEl = messageEl[messageEl.length - 1];
        if (messageEl.hasAttribute('data-typing')) {
            chatBoxEl.removeChild(messageEl);
            return;
        }
        var typingEl = messageEl.lastChild;
        messageEl.removeChild(typingEl);
    }

    function onMessage(evt) {
        evt.preventDefault();
        var msg = messageInputEl.value.trim();
        if (!msg)
            return;
        if (isTyping) {
            clearTimeout(lastTimeout);
            isTyping = false;
            socket.emit('ended typing', username);
        }
        postMessage(msg, username, new Date());
        socket.emit('chat message', msg, username);
        messageInputEl.value = '';
    }

    function postNotice(user) {
        var index = users.indexOf(user);
        var hasLeft = index > -1;
        var newNoticeEl = document.createElement('li');
        newNoticeEl.classList.add('notice');
        var newUserEl = document.createElement('span');
        newUserEl.classList.add('user');
        newUserEl.appendChild(document.createTextNode(user));
        newNoticeEl.appendChild(newUserEl);
        newNoticeEl.appendChild(document.createTextNode(' ' + (hasLeft ? 'disconnected' : 'connected')));
        chatBoxEl.appendChild(newNoticeEl);
        scrollDown();
        if (hasLeft) {
            usersOnlineEl.removeChild(usersOnlineEl.querySelector('div[data-user="' + user + '"]'));
            users.splice(index, 1);
        } else {
            var newUserListEl = document.createElement('div');
            newUserListEl.setAttribute('data-user', user);
            newUserListEl.appendChild(document.createTextNode(user));
            usersOnlineEl.appendChild(newUserListEl);
            users.push(user);
        }
        updateUserNum(users.length);
    }

    function postMessage(msg, user) {
        var time = getTime();
        var newBubbleEl = document.createElement('div');
        newBubbleEl.classList.add('bubble');
        newBubbleEl.setAttribute('data-time', time);
        newBubbleEl.appendChild(document.createTextNode(msg));
        var newTimeEl;
        var lastMessageEl = chatBoxEl.querySelectorAll('li');
        lastMessageEl = lastMessageEl[lastMessageEl.length - 1];
        if (lastMessageEl && lastMessageEl.getAttribute('data-user') === user) {
            var lastBubbleEl = lastMessageEl.querySelectorAll('.bubble');
            lastBubbleEl = lastBubbleEl[lastBubbleEl.length - 1];
            if (lastBubbleEl.getAttribute('data-time') === time) {
                var brEl = document.createElement('br');
                lastMessageEl.insertBefore(brEl, lastBubbleEl.nextSibling);
                lastMessageEl.insertBefore(newBubbleEl, brEl.nextSibling);
            } else {
                newTimeEl = document.createElement('span');
                newTimeEl.classList.add('time');
                newTimeEl.appendChild(document.createTextNode(time));
                lastMessageEl.appendChild(newBubbleEl);
                lastMessageEl.appendChild(newTimeEl);
            }
        } else {
            var newMessageEl = document.createElement('li');
            newMessageEl.setAttribute('data-user', user);
            if (user === username)
                newMessageEl.classList.add('mine');
            else {
                var newUserEl = document.createElement('span');
                newUserEl.classList.add('name');
                newUserEl.appendChild(document.createTextNode(user));
                newMessageEl.appendChild(newUserEl);
            }
            newTimeEl = document.createElement('span');
            newTimeEl.classList.add('time');
            newTimeEl.appendChild(document.createTextNode(time));
            newMessageEl.appendChild(newBubbleEl);
            newMessageEl.appendChild(newTimeEl);
            chatBoxEl.appendChild(newMessageEl);
        }
        scrollDown();
    }

    function updateUserNum(newUserNum) {
        if (newUserNum === 0) {
            userNumEl[0].innerHTML = 'No Users Online';
            userNumEl[1].innerHTML = 'No Users Online';
            return;
        }
        userNumEl[0].innerHTML = 'View ' + newUserNum + ' User' + (users.length > 1 ? 's' : '');
        userNumEl[1].innerHTML = newUserNum + ' User' + (users.length > 1 ? 's' : '') + ' Online';
    }

    function toggleSideBar() {
        usersOnlineEl.classList.toggle('users-online--visible');
    }

};

function getTime() {
    var time = new Date();
    var hours = time.getHours();
    var minutes = time.getMinutes();
    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;
    return hours + ':' + minutes;
}

function scrollDown() {
    window.scrollTo(0, document.body.scrollHeight);
}
