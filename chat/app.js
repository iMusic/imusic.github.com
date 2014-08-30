var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
	res.send('<h2>Not Found<h2>');
});

var users = {};

io.on('connection', function (socket) {
	socket.on('login', function (data) {
		if (isQQ(data.uin) && !users[data.uin]) {
			socket.uin = data.uin;
			users[data.uin] = data;
			socket.emit('login', users);
			socket.broadcast.emit('useradd', data);
		} else {
			io.emit('no-login');
		}
	});

	socket.on('disconnect', function () {
		if (users[socket.uin]) {
			delete users[socket.uin];
		}
		io.emit('logout', {uin: socket.uin});
	});

	socket.on('message', function (data) {
		io.emit('message', data);
	});
});

http.listen(3000, function () {
	console.log('listening');
});

function isQQ(n) {
	return /^[1-9]{1}\d{4,11}$/.test(n);
}