window.onload = () => {

    const socket = io('https://pole-chat.herokuapp.com/');
    const spinnerEl = document.querySelector('.spinner__container');
    const loginWrapperEl = document.querySelector('.login__wrapper');
    const loginFormEl = document.querySelector('.login');
    const loginInputEl = document.querySelector('.login-input');
    const usernameInvalidEl = document.querySelector('.username-invalid');
    const usernameTakenEl = document.querySelector('.username-taken');
    const usersOnlineEl = document.querySelector('.users-online');
    const userNumEl = document.querySelectorAll('.user-no');
    const chatBoxEl = document.querySelector('.chatbox');
    const messageFormEl = document.querySelector('.send-msg form');
    const messageInputEl = document.querySelector('.msg');
    const openSideBarEl = document.querySelector('.pull');
    const closeSideBarEl = document.querySelector('.close');
    let init = false;
    let username;
    let users;
    let isTyping = false;
    let lastTimeout;
    let blurred = false;
    let unreadMessages = 0;

    loginFormEl.addEventListener('submit', onLogin);
    messageFormEl.addEventListener('submit', onMessage);
    openSideBarEl.addEventListener('click', toggleSideBar);
    closeSideBarEl.addEventListener('click', toggleSideBar);
    messageInputEl.onkeydown = onTyping;

    window.onblur = evt => {
        blurred = true;
    };
    window.onfocus = evt => {
        blurred = false;
        unreadMessages = 0;
        document.title = 'Pole Chat';
    };

    socket.on('init', onInit);
    socket.on('invalid username', onUserInvalid);
    socket.on('username taken', onUserTaken);
    socket.on('login successfull', onSuccessfullLogin);
    socket.on('joined', postNotice);
    socket.on('disconnect', postNotice);
    socket.on('chat message', postMessage);
    socket.on('started typing', onStartedTyping);
    socket.on('ended typing', onEndedTyping);

    function onLogin(evt) {
        evt.preventDefault();
        username = loginInputEl.value.trim();
        socket.emit('login', username);
    }

    function onSuccessfullLogin() {
        users.push(username);
        updateUserNum(users.length);
        const meEl = document.querySelector('.me');
        meEl.appendChild(document.createTextNode(username));
        meEl.style.display = 'block';

        loginWrapperEl.addEventListener('transitionend', evt => {
            loginWrapperEl.parentNode.removeChild(loginWrapperEl);
            loginWrapperEl.removeEventListener('transitionend', this);
        });

        loginWrapperEl.classList.add('login__wrapper--disabled');

        loginFormEl.removeEventListener('submit', onLogin);
    }

    function onUserInvalid() {
        if (usernameTakenEl.style.display === 'block')
            usernameTakenEl.style.display = 'none';
        if (usernameInvalidEl.style.display === 'none' || !usernameInvalidEl.style.display)
            usernameInvalidEl.style.display = 'block';
    }

    function onUserTaken() {
        if (usernameInvalidEl.style.display === 'block')
            usernameInvalidEl.style.display = 'none';
        if (usernameTakenEl.style.display === 'none' || !usernameTakenEl.style.display)
            usernameTakenEl.style.display = 'block';
    }

    function onInit(existingUsers) {
        init = true;
        users = existingUsers;
        updateUserNum(users.length);
        users.forEach(user => {
            const newUserListEl = document.createElement('div');
            newUserListEl.setAttribute('data-user', user);
            const newUsername = document.createTextNode(user);
            newUserListEl.appendChild(newUsername);
            usersOnlineEl.appendChild(newUserListEl);
        });
        spinnerEl.addEventListener('transitionend', evt => {
            spinnerEl.parentNode.removeChild(spinnerEl);
            spinnerEl.removeEventListener('transitionend', this);
        });
        spinnerEl.classList.add('spinner__container--disabled');
    }

    function onTyping(evt) {
        const key = evt.keyCode;
        if (key === 9 || key === 13) return;
        if (key >= 16 && key <= 45) return;
        if (key >= 91 && key <= 93) return;
        if (key >= 112 && key <= 145) return;
        if (!isTyping) {
            isTyping = true;
            socket.emit('started typing', username);
        }
        if (lastTimeout)
            clearTimeout(lastTimeout);
        lastTimeout = setTimeout(() => {
            isTyping = false;
            socket.emit('ended typing', username);
        }, 2000);
    }

    function onStartedTyping(user) {
        const newBubbleEl = document.createElement('div');
        newBubbleEl.classList.add('bubble');
        newBubbleEl.classList.add('typing-indicator');
        newBubbleEl.innerHTML = '<span></span><span></span><span></span>';
        let lastMessageEl = chatBoxEl.querySelectorAll('li');
        lastMessageEl = lastMessageEl[lastMessageEl.length - 1];
        if (lastMessageEl && lastMessageEl.getAttribute('data-user') === user) {
            lastMessageEl.appendChild(newBubbleEl);
            return;
        }
        const newMessageEl = document.createElement('li');
        newMessageEl.setAttribute('data-user', user);
        newMessageEl.setAttribute('data-typing', 'true');
        const newUserEl = document.createElement('span');
        newUserEl.classList.add('name');
        newUserEl.appendChild(document.createTextNode(user));
        newMessageEl.appendChild(newUserEl);
        newMessageEl.appendChild(newBubbleEl);
        chatBoxEl.appendChild(newMessageEl);
    }

    function onEndedTyping(user) {
        let messageEl = document.querySelectorAll('li[data-user="' + user + '"]');
        messageEl = messageEl[messageEl.length - 1];
        if (messageEl.hasAttribute('data-typing')) {
            chatBoxEl.removeChild(messageEl);
            return;
        }
        const typingEl = messageEl.lastChild;
        messageEl.removeChild(typingEl);
    }

    function onMessage(evt) {
        evt.preventDefault();
        const msg = messageInputEl.value.trim();
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
        const index = users.indexOf(user);
        const hasLeft = index > -1;
        const newNoticeEl = document.createElement('li');
        newNoticeEl.classList.add('notice');
        const newUserEl = document.createElement('span');
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
            const newUserListEl = document.createElement('div');
            newUserListEl.setAttribute('data-user', user);
            newUserListEl.appendChild(document.createTextNode(user));
            usersOnlineEl.appendChild(newUserListEl);
            users.push(user);
        }
        updateUserNum(users.length);
    }

    function postMessage(msg, user) {
        if (blurred) {
            document.title = 'Pole Chat (' + (++unreadMessages) + ')';
        }
        const time = getTime();
        const newBubbleEl = document.createElement('div');
        newBubbleEl.classList.add('bubble');
        newBubbleEl.setAttribute('data-time', time);
        newBubbleEl.appendChild(document.createTextNode(msg));
        let newTimeEl;
        let lastMessageEl = chatBoxEl.querySelectorAll('li');
        lastMessageEl = lastMessageEl[lastMessageEl.length - 1];
        if (lastMessageEl && lastMessageEl.getAttribute('data-user') === user) {
            let lastBubbleEl = lastMessageEl.querySelectorAll('.bubble');
            lastBubbleEl = lastBubbleEl[lastBubbleEl.length - 1];
            if (lastBubbleEl.getAttribute('data-time') === time) {
                const brEl = document.createElement('br');
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
            const newMessageEl = document.createElement('li');
            newMessageEl.setAttribute('data-user', user);
            if (user === username)
                newMessageEl.classList.add('mine');
            else {
                const newUserEl = document.createElement('span');
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
    const time = new Date();
    let hours = time.getHours();
    let minutes = time.getMinutes();
    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;
    return hours + ':' + minutes;
}

function scrollDown() {
    window.scrollTo(0, document.body.scrollHeight);
}
