/** 写的什么乱78糟的 (ง •̀_•́)ง┻━┻ **/

var $ = function(id) {
	return document.querySelector(id);
}

var $$= function(el) {
	return document.querySelectorAll(el);
}


var Fx = {
	namespace: function (n, o) {
		o = o || window,
		n = n.split('.');
		for (var i = 0; i < n.length; i++) {
			o[n[i]] = o[n[i]] || {};
			o = o[n[i]];
		}
		return o;
	},
	extend: function (obj, ext) {
		var i, len, name, args = arguments, value;
		for (i = 1, len = args.length; i < len; i++) {
			ext = args[i];
			for (name in ext) {
				if (ext.hasOwnProperty(name)) {
					value = ext[name];
					if (value !== undefined) {
						obj[name] = value;
					}
				}
			}
		}
		return obj;
	},
	create: function (s, p) {
		var cn, ns;
		cn = s.match(/(^|\.)(\w+)$/i)[2];
		ns = this.namespace(s.replace(/\.\w+$/, ''));
		ns[cn] = p [cn];
		this.extend(ns[cn].prototype, p);
	},
	format: function(str, param) {
		var data = param.length == 1 && typeof param[0] == "object" ? param[0] : param;
		return str.replace(/\{([\d\w]+)\}/g, function(m, n) {
			return typeof data[n] != "undefined" ? data[n].toString() : m;
		});
	}
}

Fx.ex = {
	isQQ: function (n) {
		return /^[1-9]{1}\d{4,11}$/.test(n);
	}
}

Fx.create('Fx.ui.Popup', {
	tml:
		'<div class="popup-cnt">\
			<i class="popup-icon" data-icon="{type}"></i>\
			<p class="popup-txt">{text}</p>\
		</div>\
		<div class="popup-btn"></div>',
	Popup: function (args) {
		var self = this;
		var id = 'popup_' + new Date().getTime();
		this.id = id;

		var def = {
			type: 'm-succ',
			text: '内容未定义',
			buttons: [new Fx.ui.Button({
				text: '确定',
				click: function() {
					self.remove();
				}
			})]
		};

		var options = Fx.extend(def, args);

		var popup = document.createElement('div');
		this.el = popup;
		popup.id = id;
		popup.className = 'popup-box';
		popup.innerHTML = Fx.format(self.tml, {
			type: options.type,
			text: options.text
		});
		document.body.appendChild(popup);

		var btnEl = popup.querySelector('.popup-btn');
		for (var i = 0; i < options.buttons.length; i++) {
			btnEl.appendChild(options.buttons[i].el);
		}
	},

	remove: function () {
		document.body.removeChild(this.el);
	}
});

Fx.create('Fx.ui.Button', {
	Button: function (args) {
		var button = document.createElement('button');
		button.innerHTML = args.text || '';
		button.addEventListener('click', args.click || function () {}, false);
		this.el = button;
	}
});


// >>>>>>>>>以上是工具函数<<<<<<<<<<< //
// 当前登录记录
var User = {
	uin: 0,
	nick: '',
	bubble: 0
}

// 本机登录记录
var Users = {};
var Users_tmpl =
	'<div class="img-box">\
		<img src="http://q.qlogo.cn/headimg_dl?dst_uin={uin}&spec=40">\
	</div>\
	<span>{nick}</span>\
	<p>{uin}</p>\
	<i>r</i>';

// 在线聊天列表
var userList = {};

// 设置
var config = {
	online: true,
	message: true,
	callme: false,
	notify: false
}

/* Login */
;(function () {
	Fx.extend(Fx.ex, {
		getQQ: function (src, cb) {
			var cb = cb();
			var s = document.createElement('script');
			s.src = src;
			document.head.appendChild(s);
			document.head.removeChild(s);
			return cb;
		}
	});

	history.replaceState({}, null, 'login/');
	var userInfo = localStorage.user;
	// 如果有登录记录
	if (userInfo) {
		userInfo = JSON.parse(userInfo);
		User.uin = userInfo.uin;
		// 判断是否自动登录
		if (!userInfo.isAuto) {
			$('#J_loginAvatar').src = 'http://q.qlogo.cn/headimg_dl?dst_uin='+ userInfo.uin +'&spec=100';
			$('#J_loginUin').value = userInfo.uin;
		} else {
			showUser(userInfo.uin);
		}
	}

	// 加载登陆过的列表
	Users = localStorage.users ? JSON.parse(localStorage.users) : {};
	var fragment =  document.createDocumentFragment();
	for (var uin in Users) {
		var li = document.createElement('li');
		li.id = 'users_' + uin;
		li.dataset['uin'] = uin;
		li.innerHTML = Fx.format(Users_tmpl, Users[uin]);
		fragment.appendChild(li);
	}
	$('.login-list').appendChild(fragment);


	// 判断输入框号码
	$('#J_loginUin').addEventListener('input', function() {
		if (!Users[this.value]) {
			uin = 12345;
		} else {
			uin = this.value;
		}
		$('#J_loginAvatar').src = 'http://q.qlogo.cn/headimg_dl?dst_uin='+ uin +'&spec=100';
	}, false);

	$('#J_loginUin').addEventListener('keydown', function(e) {
		if (e.keyCode === 13) {
			login();
		}
	}, false);

	// 选择登录过的号码
	$('#J_loginSel').addEventListener('click', function (e) {
		e.stopPropagation();
		if (this.className == 'on') {
			this.className =  '';
			$('.login-list').style.display = 'none';
		} else {
			this.className = 'on';
			$('.login-list').style.display = 'block';

			if (Object.keys(Users).length) {
				var i = $$('.login-list li').length;
				while(i--) {
					$$('.login-list li')[i].className = '';
				}

				$('#users_' + User.uin).className = 'current';
			} else {
				$('.login-list').style.height = '50px';
			}
		}
	}, false);
	document.body.addEventListener('click', function (e) {
		$('#J_loginSel').className =  '';
		$('.login-list').style.display = 'none';
	}, false);

	var loginUl = document.querySelector('.login-list');
	var loginLis = loginUl.querySelectorAll('li');
	loginUl.addEventListener('mouseenter', function (e) {
		if (e.target.tagName.toLowerCase() === 'li') {
			[].slice.call(loginLis, 0).forEach(function (v, i) {
				v.className = (v === e.target) ? 'current' : '';
			});
		}
	}, true);

	loginUl.addEventListener('mousedown', function (e) {
		// 点击删除登陆记录
		if (e.target.tagName.toLowerCase() === 'i') {
			var node = e.target.parentNode, uin = node.dataset.uin;
			if (User.uin === uin) {
				$('#J_loginAvatar').src = 'http://q.qlogo.cn/headimg_dl?dst_uin=12345&spec=100';
				$('#J_loginUin').value = ''
				User = {};
				localStorage.removeItem('user');
			}
			delete Users[uin];
			localStorage.setItem('users', JSON.stringify(Users));
			this.removeChild(node);
			return false;
		}

		// 无记录时
		if (e.target.tagName.toLowerCase() === 'ul') {
			return false;
		}

		var node = (e.target.tagName.toLowerCase() === 'li') ? e.target : e.target.parentNode;

		$('#J_loginAvatar').src = 'http://q.qlogo.cn/headimg_dl?dst_uin='+ node.dataset.uin +'&spec=100';
		$('#J_loginUin').value = node.dataset.uin;
	}, false);

	// 点击登录
	$('#J_loginEnter').addEventListener('click', login, false);

	function login() {
		var uin = $('#J_loginUin').value.trim(),
			isAuto = $('#J_loginAuto').checked;
		if (Fx.ex.isQQ(uin)) {
			localStorage.setItem('user', JSON.stringify({uin: uin, isAuto: isAuto}));
			showUser(uin);
		} else {
			new Fx.ui.Popup({
				type: 'm-warn',
				text: '你没有QQ吗？',
				buttons: [new Fx.ui.Button({
					text: '是的',
					click: function() {
						location.href = 'http://zc.qq.com/chs/';
					}
				}), new Fx.ui.Button({
					text: '不是',
					click: function() {
						this.parentNode.parentNode.remove();
						$('#J_loginUin').select();
					}
				})]
			});
		}
	}

	// 显示聊天对话框，获取昵称
	function showUser(uin) {
		$('#J_Login').style.display = 'none';
		$('#J_Loader').style.display = 'block';
		history.replaceState({}, null, '/chat/');
		User.uin = uin;
		Fx.ex.getQQ('http://zhanchen.me/api/getQQ.php?qq=' + uin, function () {
			window.getQQ = function (data) {
				User.nick = data.nickname || uin;
				Chat();
			}
		});
	}
}());

/* chat */
function Chat() {
	var usertmpl =
		'<li id="user_{uin}">\
			<img src="http://q.qlogo.cn/headimg_dl?dst_uin={uin}&spec=40" width=16 height=16>\
			<chat:nick>{nick}</chat:nick><chat:uin>({uin})</chat:uin>\
		</li>',
		tmpl1 =
		'<div class="msg-item">\
			<img src="http://q.qlogo.cn/headimg_dl?dst_uin={uin}&spec=40" width=30 height=30>\
			<chat:nick>{nick}</chat:nick>\
			<chat:msg class="bubble_{bubble}">{msg}</chat:msg>\
		</div>',
		tmpl2 =
		'<div class="msg-item owner">\
			<img src="http://q.qlogo.cn/headimg_dl?dst_uin={uin}&spec=40" width=30 height=30>\
			<chat:msg class="bubble_{bubble}">{msg}</chat:msg>\
		</div>';

	var notify_id = 1;

	var socket = io.connect('http://localhost:3000/');
	socket.emit('login', User);
	socket.on('login', function (data) {
		$('#J_Loader').style.display = 'none';
		$('#J_Chat').style.display = 'block';

		var html = '';
		for (var i in data) {
			html += Fx.format(usertmpl, {uin: i, nick: data[i].nick})
		}
		$('.user-list').innerHTML = html;

		$('.notice-box').innerHTML = '<chat:notice>发送消息可按快捷键Ctrl+Enter或者Alt+S</chat:notice>';

		$('.input-cnt').removeAttribute('disabled');
		$('.input-cnt').focus();

		if (!Users[User.uin]) {
			Users[User.uin] = User;
			localStorage.setItem('users', JSON.stringify(Users));
		}

		userList = data;
	});

	socket.on('useradd', function (data) {
		$('.user-list').innerHTML += Fx.format(usertmpl, data);
		$('.user-list li:last-child').className = 'online';
		$('.user-list li:last-child').addEventListener('webkitAnimationEnd', function () {
			this.className = '';
		}, false);

		if (config.notify && document.hidden) {
			new Fx.evt.Notify().init({
				title:'系统通知',
				message: data.nick + '(' + data.uin + ')上线了',
				image: 'http://q.qlogo.cn/headimg_dl?dst_uin='+ data.uin +'&spec=40',
				tag: 3,
				timer: 3000
			});
		}

		userList[data.uin] = data;
	});

	socket.on('no-login', function () {
		new Fx.ui.Popup({
			type: 'm-warn',
			text: '发生错误鸟，重新登录',
			buttons: [new Fx.ui.Button({
				text: '好的',
				click: function() {
					location.reload();
				}
			})]
		});
	});

	socket.on('logout', function (data) {
		if ($('#user_' + data.uin))
			$('.user-list').removeChild($('#user_' + data.uin));

		if (config.notify && document.hidden) {
			new Fx.evt.Notify().init({
				title:'系统通知',
				message: userList[data.uin].nick + '(' + data.uin + ')下线了',
				image: 'http://q.qlogo.cn/headimg_dl?dst_uin='+ data.uin +'&spec=40',
				tag: 3,
				timer: 18000
			});
		}
	});

	socket.on('message', function (data) {
		var tmpl = (data.uin === User.uin) ? tmpl2 : tmpl1;
		$('.msg-cnt').innerHTML += Fx.format(tmpl, data);
		$('.msg-box').scrollTop = $('.msg-box').scrollHeight;

		if (config.notify && document.hidden) {
			notify_id = +!notify_id;
			new Fx.evt.Notify().init({
				title: data.nick + '说：',
				message: data.msg,
				image: 'http://q.qlogo.cn/headimg_dl?dst_uin='+ data.uin +'&spec=40',
				tag: notify_id + 1,
				timer: 8000
			});
		}
	});

	// 发送事件
	$('.input-btn').addEventListener('click', sendMsg, false);
	$('.input-cnt').addEventListener('keydown', function (e) {
		if ( (e.altKey && e.keyCode === 83) || (e.ctrlKey && e.keyCode === 13) ) {
			sendMsg();
		}
	}, false);

	function sendMsg() {
		var msg = $('.input-cnt').value;
		if (msg !== '') {
			$('.input-cnt').value = '';
			$('.input-cnt').focus();
			socket.emit('message', Fx.extend({}, User, {msg: msg}));
		}
	}

	// 退出事件
	$('.logout-btn').addEventListener('click', function () {
		localStorage.setItem('user', JSON.stringify({uin: User.uin, isAuto: false}));
		location.reload();
	}, false);
};

/* ┻━┻︵╰(‵□′)╯︵┻━┻ */

;(function () {
	/**
	*new Fx.evt.Notify.init({
	*	title: '凸(｀⌒´メ)凸',
	*	image: 'xxx.png',
	*	mesaage: 'f*ck you',
	*	tag: 1,
	*	timer: 3000,
	});
	**/

	Fx.create('Fx.evt.Notify', {
		Notify: function () {},
		init: function (options) {
			var notification,
				details = {};
			options = options || {};
			options.title = options.title || '';

			details.icon = options.image || null;
			details.body = options.message || '';
			details.tag = options.tag || '';

			try {
				if (Notification.permission === 'denied') {
					new Fx.ui.Popup({
						type: 'm-warn',
						text: '对不起，你已关闭了chrome通知功能',
						buttons: [new Fx.ui.Button({
							text: '确认',
							click: function() {
								this.parentNode.parentNode.remove();
							}
						})]
					});
				}
				notification = new Notification(options.title, details);

				if (typeof options.timer === 'number') {
					notification.onshow = function () {
						setTimeout(function () {
							notification.close();
						}, options.timer);
					}
				}

				notification.onclick = function () {
					window.focus();
				}
			} catch(err) {
				new Fx.ui.Popup({
					type: 'm-warn',
					text: '你的浏览器不支持这个功能',
					buttons: [new Fx.ui.Button({
						text: '知道了',
						click: function() {
							this.parentNode.parentNode.remove();
						}
					})]
				});
			}
		},
		check: function (test) {
			switch (Notification.permission) {
				case 'granted':
					if (test) {
						var notification_2 = new Notification('我来组成头部', {body: '[测试]你是猴子请来的逗逼吗？'});
						notification_2.onshow = function () {
							setTimeout(function () {
								notification_2.close();
							}, 3000);
						}
					}
					break;
				case 'default':
					new Fx.ui.Popup({
						type: 'm-warn',
						text: '你将开启chrome的通知功能，请在确认后点击<strong>允许</strong>按钮',
						buttons: [new Fx.ui.Button({
							text: '确认',
							click: function() {
								this.parentNode.parentNode.remove();
								Notification.requestPermission(function (permission) {
									if (permission === 'granted') {
										var notification_1 = new Notification('你已经开启通知功能');
										notification_1.onshow = function () {
											setTimeout(function () {
												notification_1.close();
											}, 3000);
										}
									}
								});
							}
						})]
					});
					break;
				case 'denied':
					$('#w_notify').checked = false;
					$('#w_notify').disabled = true;
					new Fx.ui.Popup({
						type: 'm-warn',
						text: '对不起，你已关闭了chrome通知功能',
						buttons: [new Fx.ui.Button({
							text: '确认',
							click: function() {
								this.parentNode.parentNode.remove();
							}
						})]
					});
					break;
				default: break;
			}
		}
	});


	var sound = document.createElement('audio');
	sound.volume = .4;

	if (localStorage.config) {
		config = JSON.parse(localStorage.config);
	} else {
		localStorage.config = JSON.stringify(config);
	}

	$('#w_online').checked = config.online;
	$('#w_message').checked = config.message;
	$('#w_callme').checked = config.callme;
	$('#w_notify').checked = config.notify;

	$('#w_online').addEventListener('click', function (e) {
		config.online = $('#w_online').checked;
		localStorage.config = JSON.stringify(config);
	}, false);
	$('#w_message').addEventListener('click', function (e) {
		config.message = $('#w_message').checked;
		localStorage.config = JSON.stringify(config);
	}, false);
	$('#w_callme').addEventListener('click', function (e) {
		config.callme = $('#w_callme').checked;
		localStorage.config = JSON.stringify(config);
	}, false);
	$('#w_notify').addEventListener('click', function (e) {
		config.notify = $('#w_notify').checked;
		localStorage.config = JSON.stringify(config);

		if (config.notify) {
			new Fx.evt.Notify().check();
		}
	}, false);

	$('#cs_online').addEventListener('click', function (e) {
		sound.src = 'http://yun.365.sh/s/32718.mp3';
		sound.play();
	}, false);
	$('#cs_message').addEventListener('click', function (e) {
		sound.src = 'http://yun.365.sh/s/32717.mp3';
		sound.play();
	}, false);
	$('#cs_callme').addEventListener('click', function (e) {
		sound.src = 'http://yun.365.sh/s/32716.mp3';
		sound.play();
	}, false);
	$('#cs_notify').addEventListener('click', function (e) {
		new Fx.evt.Notify().check(true);
	}, false);

	// 备用
	document.addEventListener('visibilitychange', function() {
		
	}, false);

}());

