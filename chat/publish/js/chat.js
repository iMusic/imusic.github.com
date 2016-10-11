/**
 * update 2016-10-10
 * 2年前写的，这次更新主要修改请求接口
 *
 * 另外最近用vue重构了一个mac版UI的QQ
 * github: https://github.com/vczhan/chat
 * demo: http://ichat.coding.io/#!/login
 */


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
  nickname: '',
  avatar: '',
  bubble: 0
}

// 本机登录记录
var Users = {};
var Users_tmpl =
  '<div class="img-box">\
    <img src="http://q.qlogo.cn/headimg_dl?dst_uin={uin}&spec=40">\
  </div>\
  <span>{nickname}</span>\
  <p>{uin}</p>\
  <i>྾</i>';

// 在线聊天列表
var userList = {};

// 设置
var config = {
  online: true,
  message: true,
  callme: false,
  notify: false
}

var sound = document.createElement('audio');
sound.volume = .4;


FSS('backskin');

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

  history.replaceState({}, null, '/login');
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
      uin = 3333333;
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
      [].forEach.call(loginLis, function (v, i) {
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
    $('body').classList.remove('login-status');
    $('.loading-dots').classList.add('ani_dot');
    history.replaceState({}, null, '/chat');
    User.uin = uin;
    User.avatar = 'http://q.qlogo.cn/headimg_dl?dst_uin='+ uin +'&spec=40'
    Fx.ex.getQQ('http://vczhan.com/api/getQQ.php?qq=' + uin, function () {
      window.getQQ = function (data) {
        User.nickname = data.nickname || uin;
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
      <chat:nick>{nickname}</chat:nick><chat:uin>({uin})</chat:uin>\
    </li>',
    tmpl1 =
    '<div class="msg-item">\
      <img src="http://q.qlogo.cn/headimg_dl?dst_uin={uin}&spec=40" width=30 height=30>\
      <chat:nick>{nickname}</chat:nick>\
      <chat:msg class="bubble_{bubble}">{content}</chat:msg>\
    </div>',
    tmpl2 =
    '<div class="msg-item owner">\
      <img src="http://q.qlogo.cn/headimg_dl?dst_uin={uin}&spec=40" width=30 height=30>\
      <chat:msg class="bubble_{bubble}">{content}</chat:msg>\
    </div>';

  var notify_id = 1;

	try {
		switch(Notification.permission) {
			case 'denied':
				$('#w_notify').disabled = true
				$('#w_notify').checked = false
				break
			case 'granted':
				$('#w_notify').disabled = false
				$('#w_notify').checked = true
		}
	} catch(err) {}

  var socket = io('http://ichat.coding.io');
  socket.emit('login', User);
  socket.on('usersUpdate', function (data) {
    $('#J_Loader').style.display = 'none';
    $('#J_Chat').style.display = 'block';
    $('.loading-dots').classList.remove('ani_dot');

    var html = '';
    for (var i in data) {
      html += Fx.format(usertmpl, {uin: data[i].uin, nickname: data[i].nickname})
    }
    $('.user-list').innerHTML = html;

    $('.notice-box').innerHTML = '<chat:notice>发送消息可按快捷键<kbd>Ctrl</kbd>+<kbd>Enter</kbd>或者<kbd>Alt</kbd>+<kbd>S</kbd></chat:notice>';

    // 文本框
    RichTextOP();

    if (!Users[User.uin]) {
      Users[User.uin] = User;
      localStorage.setItem('users', JSON.stringify(Users));
    }

    userList = data;
  });

  socket.on('join', function (data) {
    $('.user-list').innerHTML += Fx.format(usertmpl, data);
    $('.user-list li:last-child').className = 'online';
    $('.user-list li:last-child').addEventListener('webkitAnimationEnd', function () {
      this.className = '';
    }, false);

    if (config.notify && document.hidden) {
      new Fx.evt.Notify().init({
        title:'系统通知',
        message: data.nickname + '(' + data.uin + ')上线了',
        image: 'http://q.qlogo.cn/headimg_dl?dst_uin='+ data.uin +'&spec=40',
        tag: 3,
        timer: 3000
      });
    }

    // if (config.online) {
    //   sound.src = 'http://yun.365.sh/s/32718.mp3';
    //   sound.play();
    // }

    userList[data.uin] = data;
  });

  socket.on('loginErr', function (info) {
    new Fx.ui.Popup({
      type: 'm-warn',
      text: info,
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
        message: userList[data.uin].nickname + '(' + data.uin + ')下线了',
        image: 'http://q.qlogo.cn/headimg_dl?dst_uin='+ data.uin +'&spec=40',
        tag: 3,
        timer: 18000
      });
    }
  });

  socket.on('message', function (data) {
    data.bubble = data.bubble || 0;
    var tmpl = (data.uin === User.uin) ? tmpl2 : tmpl1;
    $('.msg-cnt').innerHTML += Fx.format(tmpl, data);
    $('.msg-box').scrollTop = $('.msg-box').scrollHeight;

    if (config.notify && document.hidden) {
      // 过滤标签
      var notify_div = document.createElement('div');
      notify_div.innerHTML = data.msg;
      var notify_msg = notify_div.innerText || notify_div.textContent;

      notify_id = +!notify_id;
      new Fx.evt.Notify().init({
        title: data.nickname + '说：',
        message: notify_msg,
        image: 'http://q.qlogo.cn/headimg_dl?dst_uin='+ data.uin +'&spec=40',
        tag: notify_id + 1,
        timer: 8000
      });
    }

    // if (data.uin != User.uin && config.message) {
    //   sound.src = 'http://yun.365.sh/s/32717.mp3';
    //   sound.play();
    // }
  });

  // 发送事件
  $('.input-btn').addEventListener('click', checkMsg, false);
  $('.input-cnt').addEventListener('keydown', function (e) {
    if ( (e.altKey && e.keyCode === 83) || (e.ctrlKey && e.keyCode === 13) ) {
      checkMsg();
    }
  }, false);

  var msgObj = {};
  var msgArr = [];

  // 检查是否需要转换图片地址
  function checkMsg() {
    msgObj = {};
    msgArr = [];
    var nodes = $('.input-cnt').childNodes;
    if (nodes.length) {
      [].forEach.call(nodes, function(v, i) {
        if (v.tagName == 'IMG' && v.src[0] == 'd') {
          msgObj[i] = [v.src, v.width, v.height];
        }
        msgArr[i] = v;
      });

      if (Object.keys(msgObj).length) {
        BasetoUrl();
      } else {
        $('#saveMsg').innerHTML = $('.input-cnt').innerHTML;
        sendMsg();
      }
      $('.input-cnt').innerHTML = '';
      $('.input-cnt').focus();
    }
  }

  // 转换图片地址
  function BasetoUrl() {
    var len = Object.keys(msgObj).length;
    for (var i in msgObj) {
      (function (i) {
        var xhr = new XMLHttpRequest(),
          fd = new FormData();
        xhr.open('POST', 'http://vczhan.com/api/upload.php', true);
        xhr.onload = function() {
          var img  = new Image();
          img.src = xhr.responseText;
          img.width = msgObj[i][1];
          img.height = msgObj[i][2];
          msgObj[i] = img;
          if (!--len) {
            sendMsg(true);
          }
        }
        xhr.onerror = function () {
          if (!--len) {
            sendMsg(true);
          }
        }
        fd.append('file', msgObj[i][0]);
        xhr.send(fd);
      })(i);
    }
  }

  function sendMsg(bool) {
    var msg = '';
    if (bool) {
      for (var i  in msgObj) {
        msgArr[i] = msgObj[i];
      }

      for (var i = 0; i < msgArr.length; i++) {
        $('#saveMsg').appendChild(msgArr[i]);
      }
    }

    msg = $('#saveMsg').innerHTML;
    $('#saveMsg').innerHTML = '';
    socket.emit('message', Fx.extend({}, User, {content: msg}));

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
  *  title: '凸(｀⌒´メ)凸',
  *  image: 'xxx.png',
  *  mesaage: 'f*ck you',
  *  tag: 1,
  *  timer: 3000,
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


  if (localStorage.config) {
    config = JSON.parse(localStorage.config);
  } else {
    localStorage.config = JSON.stringify(config);
  }

  // $('#w_online').checked = config.online;
  // $('#w_message').checked = config.message;
  // $('#w_callme').checked = config.callme;
  $('#w_notify').checked = config.notify;

  // $('#w_online').addEventListener('click', function (e) {
  //   config.online = $('#w_online').checked;
  //   localStorage.config = JSON.stringify(config);
  // }, false);
  // $('#w_message').addEventListener('click', function (e) {
  //   config.message = $('#w_message').checked;
  //   localStorage.config = JSON.stringify(config);
  // }, false);
  // $('#w_callme').addEventListener('click', function (e) {
  //   config.callme = $('#w_callme').checked;
  //   localStorage.config = JSON.stringify(config);
  // }, false);
  $('#w_notify').addEventListener('click', function (e) {
    if (Notification.permission === 'denied') {
      $('#w_notify').checked = false;
      $('#w_notify').disabled = true;
      return;
    }
    config.notify = $('#w_notify').checked;
    localStorage.config = JSON.stringify(config);

    if (config.notify) {
      new Fx.evt.Notify().check();
    }
  }, false);

  // $('#cs_online').addEventListener('click', function (e) {
  //   sound.src = 'http://yun.365.sh/s/32718.mp3';
  //   sound.play();
  // }, false);
  // $('#cs_message').addEventListener('click', function (e) {
  //   sound.src = 'http://yun.365.sh/s/32717.mp3';
  //   sound.play();
  // }, false);
  // $('#cs_callme').addEventListener('click', function (e) {
  //   sound.src = 'http://yun.365.sh/s/32716.mp3';
  //   sound.play();
  // }, false);
  $('#cs_notify').addEventListener('click', function (e) {
    new Fx.evt.Notify().check(true);
  }, false);

  // 备用
  document.addEventListener('visibilitychange', function() {

  }, false);

}());

function RichTextOP() {
  var obj = document.querySelector('.input-cnt');

  obj.contentEditable = true;
  obj.focus();

  var RichText = {
      content: obj,
      updateLastSelectedRange: function (range) {
          try {
              this.lastSelectedRange = range || window.getSelection().getRangeAt(0).cloneRange();
          } catch (err) {
              this.focus();
          }
      },
      checkContent: function () {
        this.updateLastSelectedRange();
      },
      onContentChanged: function () {
          var root = this.content;
          var firstChild = root.firstChild;
          if (firstChild && firstChild == root.lastChild && firstChild.tagName.toLowerCase() == 'br') {
              root.removeChild(firstChild);
          }
      },
      getContent: function (type) {
          var _content = this.content;
          if (!_content) {return '';}
          switch (type) {
              case 'node':
                  return _content;
              case 'html':
                  return _content.innerHTML;
              default:
                  return _content.innerText || _content.textContext || '';
          }

      },
      insertToContent: function (val, type, getRangeToFocus, callback) {
          var original = this.getContent();
          var range = this.lastSelectedRange;
          if (range == null) {alert(1)};
          switch (type) {
              case 'node':
                  break;
              case 'html':
                  val = '1111';
                  break;
              default:
                  val = document.createTextNode(val);
          }

          range.deleteContents();
          range.insertNode(val);
          getRangeToFocus = getRangeToFocus || function () {
              range.collapse(false);
              return range;
          };
          range = getRangeToFocus();
          this.focusToRange(range);
          this.onContentChanged(original, this.getContent());
      },
      getNodes: function (node, nodes) {
        nodes = nodes || [];
        for (var i = 0, l = node.childNodes.length; i < l; i++) {
          var _node = node.childNodes[i];
          !!_node.firstChild ? this.getNodes(_node, nodes) : nodes.push(_node);
        }
        return nodes;
      },
      parseNode: function (node) {
        var nodes = [];
        for (var i = 0, l = node.childNodes.length; i < l; i++) {
          var _node = node.childNodes[i];

          // 纯文字
          if (_node.nodeType === 3) {
            nodes.push(_node);
            continue;
          }

          // 图片
          if (_node.tagName === 'IMG') {
            var img = new Image();
            img.src = _node.src;
            //img.width = _node.width || parseInt(window.getComputedStyle(_node, null).width);
            //img.height = _node.height || parseInt(window.getComputedStyle(_node, null).height);
            nodes.push(img);
            continue;
          }

          // 其他标签
          var nodeDisplay = window.getComputedStyle(_node, null).display;
          if (nodeDisplay === 'block' || nodeDisplay === 'list-item') {
            var div = document.createElement('div');
            var s = this.parseNode(_node);
            var fragment =  document.createDocumentFragment();
            for (var j = 0; j < s.length; j++) {
              fragment.appendChild(s[j]);
            }
            div.appendChild(fragment);
            nodes.push(div);
          }
          else if (nodeDisplay === 'inline') {
            var fragment =  document.createElement('span');
            var s = this.parseNode(_node);
            for (var j = 0; j < s.length; j++) {
              fragment.appendChild(s[j]);
            }
            nodes.push(fragment);
          }
          else if (nodeDisplay === 'inline-block') {
            var fragment =  document.createElement('div');
            fragment.style.display = 'inline-block';
            var s = this.parseNode(_node);
            for (var j = 0; j < s.length; j++) {
              fragment.appendChild(s[j]);
            }
            nodes.push(fragment);
          }

        }
        return nodes;
      },
      parseHtml: function (node) {
        // 麻蛋，就先这样吧，
        var nodes = this.parseNode(node);
        return nodes;
        // 尼玛好多坑啊，本来append可以把输入框的node去掉的，但是在普通标签下因为需返回的纯文本而不是原来的node，所以又没去掉
        // 这里干脆都clone一份append到fragment，最后再处理输入框的内容
        // 3表示纯文本，也可以用node.tagName === undefined验证
        if (node.nodeType === 3) {
          return node.cloneNode();
        }

        // 图片不转换，可能要在处理下，所以和上面不合并了
        if (node.tagName === 'IMG') {
          var img = new Image();
          img.src = node.src;
          img.width = node.width || parseInt(window.getComputedStyle(node, null).width);
          img.height = node.width || parseInt(window.getComputedStyle(node, null).height);
          return img;
        } else {
          //node.firstChild可获得标签里面的文本，但是如果是嵌套标签就悲剧了，所以不用
          // 这里可以直接用node.innerText，因为还没append到fragment里
          // 如果以后要做@操作，还需要进一步处理
          // <a><img src=""></a> 还有这种情况要处理，ヽ(*≧ω≦)ﾉ
          // 还要考虑换行
          // 这里自己搞的有点晕，希望不要有bug，不然看不懂怎么写的不好改了
          var nodeDisplay = window.getComputedStyle(node, null).display;
          // while (node.firstChild && (node = node.firstChild));
          if (nodeDisplay === 'block') {
            var div  = document.createElement('div');
            var nodes = this.parseNode(node);
            for (var i = 0, l = nodes.length; i < l; i++) {
              div.appendChild(RichText.parseHtml(nodes[i]));
            }

            return div;
          }
          else {
            var span  = document.createElement('span');
            var nodes = this.getNodes(node);
            for (var i = 0, l = nodes.length; i < l; i++) {
              span.appendChild(RichText.parseHtml(nodes[i]));
            }
            return span;
          }
        }
        return;
      },
      focus: function () {
          var _content = this.content;
          _content.focus();
      },
      focusToEnd: function () {

      },
      focusToRange: function (range) {
          window.getSelection().removeAllRanges();
          window.getSelection().addRange(range);
          this.updateLastSelectedRange(range);
      },
      onPaste: function () {
        var _content = this.content;

        // 总结：要处理去嵌套层，换行内容用div包裹，保留纯文本，保留图片，图片去样式
        // 未解决：复杂源处理后嵌套标签太多，光标暂未处理，就先放到最后了
        var nodes = this.parseHtml(_content);
        var fragment =  document.createDocumentFragment();

        for (var i = 0, l = nodes.length; i < l; i++) {
          fragment.appendChild(nodes[i]);
        }
        obj.innerHTML = '';
        obj.appendChild(fragment);

        var lc = obj.lastChild;
        var selection = window.getSelection();
      var range= selection.getRangeAt(0);
        range.collapse(false);
      range.setStartAfter(lc);
          range.setEndAfter(lc);
      selection.removeAllRanges();
      selection.addRange(range)
      }
  }


  RichText.updateLastSelectedRange();

  //document.getElementById('btn').onclick = function () {
      //RichText.insertToContent('asdf')
  //}


  ;['mousedown', 'mouseup', 'keydown', 'keyup'].forEach(function (event) {
      obj.addEventListener(event, function () {
          RichText.updateLastSelectedRange.call(RichText)
      }, false);
  });

  // emoji
  var arr_105 = new Array(105).join().split(',').map(function (v, i) {return i++;});
  var emoji_html = '<i data-emoji="' + arr_105.join('"></i><i data-emoji="') + '"></i>';
  $('.emoji-cnt').innerHTML = emoji_html;

  $('.emoji').addEventListener('click', function (e) {
    e.stopPropagation();
    if (this.classList.contains('on')) {
      $('.emoji-cnt').style.display = 'none';
      this.classList.remove('on');
    } else {
      $('.emoji-cnt').style.display = 'block';
      this.classList.add('on');
    }
  }, false);

  $('.emoji-cnt').addEventListener('click', function (e) {
    e.stopPropagation();
    if (e.target.tagName.toLowerCase() === 'i') {
      var emoji_id = e.target.dataset['emoji'];
      var emoji_img = new Image();
      emoji_img.src = 'http://0.web.qstatic.com/webqqpic/style/face/'+ emoji_id +'.gif';
      RichText.insertToContent(emoji_img, 'node');
      // 恢复
      if (!e.ctrlKey) {
        $('.emoji-cnt').style.display = 'none';
        $('.emoji').classList.remove('on');
      }
    }
  }, false);

  document.body.addEventListener('click', function (e) {
    $('.emoji-cnt').style.display = 'none';
    $('.emoji').classList.remove('on');
  }, false);

  $('#fileup').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (file && file.type.indexOf('image') > -1) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.src = this.result;
        RichText.insertToContent(img, 'node');

      }
      reader.readAsDataURL(file);
    }
  }, false);


  // 拖曳上传图片
  obj.addEventListener('dragover', function (e) {
    e.preventDefault();
  }, false);

  obj.addEventListener('drop', function (e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    //console.log(file);
    if (file && file.type.indexOf('image') > -1) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.src = this.result;
        RichText.insertToContent(img, 'node');

      }
      reader.readAsDataURL(file);
    }
  }, false);


  obj.addEventListener('paste', function (e) {
    if (e.clipboardData.types[0].indexOf('text') > -1) {
      setTimeout(RichText.onPaste.bind(RichText));
      return;
    }

    // 截图
      if (e.clipboardData && e.clipboardData.items[0].type.indexOf('image') > -1) {

      var reader = new FileReader();
        file = e.clipboardData.items[0].getAsFile();

      reader.onload = function(e) {
        var img = new Image();
              img.src = this.result;
              RichText.insertToContent(img, 'node');
      }
      reader.readAsDataURL(file);
    }

  }, false);

  var
    doc = document,
    bd = doc.body;

  var Clip = {
    init : function() {
      this.status = 0;

      this.isMdown = false;
      this.isMask = false;

      this.maskDiv = null;
      this.clipDiv = null;

      this.clipObj = {};

      this.node = bd;

      this.st = null;
      clearTimeout(this.st);

      bd.classList.remove('clip');
      $('.snapshot').classList.remove('on')
    },

    initEvent : function(e) {
      var _this = this;

      this.init();

      doc.addEventListener('mousedown', this.mouseDown, false);
      doc.addEventListener('mousemove', this.areaOp, false);
      doc.addEventListener('dblclick', this.clipOp, false);
      doc.addEventListener('keydown', function (e) {
        if (_this.isMask && e.keyCode === 27) {
          _this.ESC();
        }
      }, false);

      $('.snapshot').addEventListener('mousedown', this.printMod, false);

      $('.msg-cnt').addEventListener('dblclick', function(e) {
          if (e.target.tagName.toLowerCase() == 'img') {
             window.open(e.target.src)
          }
      }, false);

      $('.input-cnt').addEventListener('dblclick', function(e) {
          if (e.target.tagName.toLowerCase() == 'img') {
             window.open(e.target.src)
          }
      }, false);

      window.addEventListener('resize', function(e) {
        if (_this.status) {
          _this.docW = bd.scrollWidth;
          if (_this.status === 1) {
            _this.areaRender();
          } else {
            _this.maskDiv.style.borderRightWidth = (_this.docW - _this.clipObj.x - _this.clipObj.w - 2) + 'px';
          }
        }
      }, false);

      doc.addEventListener('mouseup', function() {
        !!_this.isMdown && (_this.isMdown = false);
      }, false);

    },

    printMod : function(e) {
      e.stopPropagation();
      var _this = Clip;
      if (!_this.isMask) {
        bd.classList.add('clip');
        _this.status = 1;
        _this.isMask = true;

        _this.docW = bd.scrollWidth;
        _this.docH = bd.scrollHeight;

        _this.maskDiv = doc.createElement('div');
        _this.maskDiv.dataset.mark = 'mask';
        _this.maskDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;border:0 solid rgba(0,0,0,.5); border-bottom-width:' + _this.docH + 'px;z-index:99;';
        bd.appendChild(_this.maskDiv);

        $('.snapshot').classList.add('on');

      }
    },

    mouseDown : function(e) {
      var _this = Clip;
      if (_this.status) {
        if (e.button === 0 && _this.status === 1) {
          clearTimeout(_this.st);
          _this.st = setTimeout(function() {
            _this.status = 2;
            _this.maskDiv.style.cssText += 'width:auto;height:auto;border:0 solid rgba(0,0,0,.5);border-bottom-width:' + _this.docH + 'px';

            _this.clipObj.x = _this.clipObj._x = e.pageX;
            _this.clipObj.y = _this.clipObj._y = e.pageY;

            _this.clipDiv = doc.createElement('div');
            _this.clipDiv.dataset.mark = 'clip';
            _this.clipDiv.style.cssText = 'position:absolute;left:'+ e.pageX +'px;top:'+ e.pageY +'px;border:1px solid #0A7CCA;';
            bd.appendChild(_this.clipDiv);
            _this.isMdown = true;
          }, 250);
        } else if (e.button === 2) {
          doc.addEventListener('contextmenu', _this.cancelRmouse, false);
          if (_this.status === 1) {
            _this.ESC();
          } else {
            _this.status = 1;
            _this.maskDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;width:auto;height:auto;border:0 solid rgba(0,0,0,.5); border-bottom-width:' + _this.docH + 'px;pointer-events:none;';
            bd.removeChild(_this.clipDiv);
            _this.clipDiv = null;
          }
        }
      }
    },

    areaOp : function(e) {
      var _this = Clip;
      if (!!_this.isMdown) {
        if (e.pageX > _this.docW || e.pageX < 0 || e.pageY > _this.docH || e.pageY < 0) {
          return;
        }

        _this.clipObj._w = e.pageX - _this.clipObj._x,
        _this.clipObj._h = e.pageY - _this.clipObj._y;
        _this.clipObj.w = Math.abs(_this.clipObj._w);
        _this.clipObj.h = Math.abs(_this.clipObj._h);

        _this.clipDiv.style.width = _this.clipObj.w + 'px';
        _this.clipDiv.style.height = _this.clipObj.h + 'px';

        if (_this.clipObj._w < 0) {
          _this.clipDiv.style.left = e.pageX + 'px';
          _this.clipObj.x = e.pageX;
        }

        if (_this.clipObj._h < 0) {
          _this.clipDiv.style.top = e.pageY + 'px';
          _this.clipObj.y = e.pageY;
        }

        _this.maskRender();
      }
    },

    clipOp : function(e) {
      var _this = Clip;
      if (!_this.status) {
        return;
      }

      clearTimeout(_this.st);

      // if (!_this.sound) {
      //   _this.sound = doc.createElement('audio');
      //   _this.sound.src = 'http://yun.365.sh/s/40091.mp3';
      // }
      // _this.sound.play();

      _this.clearRender();

      html2canvas(bd, {
          onrendered: function(canvas) {
              var data = canvas.getContext('2d').getImageData(_this.clipObj.x, _this.clipObj.y, _this.clipObj.w, _this.clipObj.h);
              var c = document.createElement('canvas');
              c.width = _this.clipObj.w;
              c.height = _this.clipObj.h;
              var ctx = c.getContext('2d');
              ctx.putImageData(data, 0, 0);

              var img = new Image();
              img.src = c.toDataURL();
              RichText.insertToContent(img, 'node');

              _this.init();
          }
      });
    },

    maskRender : function() {
      var brw = this.docW - this.clipObj.x - this.clipObj.w - 2,
        bbw = this.docH - this.clipObj.y - this.clipObj.h - 2;

      brw = brw > 0 ? brw : 0;
      bbw = bbw > 0 ? bbw : 0;

      var maskHtml =
        'width:' + (this.clipObj.w + 2) + 'px;\
        height:' + (this.clipObj.h + 2) + 'px;\
        border-width:' + this.clipObj.y + 'px \
        ' + (brw) + 'px\
        ' + (bbw) + 'px\
        ' + this.clipObj.x + 'px';

      this.maskDiv.style.cssText += maskHtml;
    },

    clearRender : function() {
      !!this.maskDiv && bd.removeChild(this.maskDiv);
      !!this.clipDiv && bd.removeChild(this.clipDiv);
    },

    ESC : function() {
      this.clearRender();
      this.init();
    },

    cancelRmouse : function(e) {
      e.preventDefault();
      doc.removeEventListener('contextmenu', Clip.cancelRmouse, false);
    },

    getNode : function(el, arg) {
      do {
        if (el.getAttribute(arg) || el == document.body) {
          return el;
        }
      } while(el = el.parentNode);
    },

    getPos : function(el) {
      var _x = 0, _y = 0, self = el;
      do{
        if(el == self) {
          _x = el.offsetLeft;
          _y = el.offsetTop;
        }
        else {
          _x += el.offsetLeft + el.clientLeft;
          _y += el.offsetTop + el.clientTop;
        }
      } while (el = el.offsetParent);
      return {x: _x, y: _y};
    }
  }

  Clip.initEvent();
};


/* >>>>>> console  <<<<< */
console.log('发送消息快捷键 %c%s%c 或者 %c%s', 'background:#f7f7f7;color:#333;padding:0 2px;', 'Alt+S', 'color:inherit;', 'background:#f7f7f7;color:#333;padding:0 2px;', 'Ctrl+Enter');
console.log('退出截图可用 %c%s%c 或者 %c%s', 'background:#f7f7f7;color:#333;padding:0 2px;', 'ESC', 'color:inherit;', 'color:red;', '右键');
console.log('本页面在%cchrome 37%c下开发测试，其他浏览器未作兼容', 'color:darkviolet;', 'color:inherit;');
