/*!
 * Resizable @autor Super Blade @update 2014-10-23
 * *node {String} 
 * handlers {Array}  触发
 * container {String} 限制范围，true为父级定位元素
 * constrain {Boolean} 约束比例
 * compensate {Array} 宽高补偿，主要考虑border
 * resizeStart {Function} mousedown时触发
 * resize {Function} mousemove时触发
 * resizeEnd {Function} mouseup时触发
 * TODO IE 
*/

function Resizable(opt) {
	if (!(this instanceof Resizable)) {
		return new Resizable(opt);
	}

	this.node = document.querySelector(opt.node);
	this.handlers = opt.handlers || ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
	this.constrain = opt.constrain;
	this.compensate = opt.compensate || [this.node.clientLeft * 2, this.node.clientTop * 2];
	this.minWidth = opt.minWidth || 4;
	this.minHeight = opt.minHeight || 4;

	if (opt.container) {
		this.container = opt.container === true ? this.node.offsetParent : opt.container;
		this.maxWidth = opt.maxWidth || this.container.clientWidth - this.compensate[0];
		this.maxHeight = opt.maxHeight || this.container.clientHeight - this.compensate[1];
		this.minX = opt.minX || 0;
		this.minY = opt.minY || 0;
	} else {
		this.maxWidth = opt.maxWidth || 0;
		this.maxHeight = opt.maxHeight || 0;
		this.minX = opt.minX || -1e5;
		this.minY = opt.minY || -1e5;
	}

	this.resizeStart = opt.resizeStart;
	this.resize = opt.resize;
	this.resizeEnd = opt.resizeEnd;

	this.init();
}

Resizable.prototype = {
	constructor: Resizable,
	init: function () {
		this.isMouseDown = false;
		this.lastMouseX = 0;
		this.lastMouseY = 0;
		this.lastElemLeft = 0;
		this.lastElemTop = 0;
		this.lastElemWidth = 0;
		this.lastElemHeight = 0;
		this.handler = null;
		this.initEvent();
	},
	initEvent: function () {
		var self = this, node = this.node, handlers = this.handlers;
		for (var i = 0; i < handlers.length; i++) {
			(function (i) {
				var handler;
				if (node.querySelector('.resizable-' + handlers[i])) {
					handler = node.querySelector('.resizable-' + handlers[i]);
				} else {
					handler = document.createElement('span');
					handler.className = 'resizable-' + handlers[i];
					node.appendChild(handler);
				}

				handler.addEventListener('mousedown', function(e) {
					self.mouseDownHandler(e, handlers[i]);
				}, false);
			})(i);
		}

		document.addEventListener('mousemove', function(e) {
			self.mouseMoveHandler(e);
		}, false);

		document.addEventListener('mouseup', function(e) {
			self.mouseUpHandler(e);
		}, false);
	},
	// 更新node的大小
	updateSize: function (e) {
		var tpl = 'left:{x}px;top:{y}px;width:{w}px;height:{h}px;';
		var pos = this.getMousePosition(e);
		var node = this.node;
		var spanX = pos.x - this.lastMouseX;
		var spanY = pos.y - this.lastMouseY;
		var maxWidth = this.maxWidth;
		var maxHeight = this.maxHeight;
		var minWidth = this.minWidth;
		var minHeight = this.minHeight;
		var minX = this.minX;
		var minY = this.minY;

		var w = this.lastElemWidth;
		var h = this.lastElemHeight;
		var x = this.lastElemLeft;
		var y = this.lastElemTop;
		var c = 'default';

		switch (this.handler) {
			case 'nw':
				if (this.constrain) {
					spanX = spanY = -Math.max(-spanX, -spanY);
				}
				x += spanX; y += spanY;
				w += -spanX; h += -spanY;
			break;
			case 'n':
				if (this.constrain) {
					spanX = spanY;
				}
				x += ~~(spanX / 2); y += spanY;
				w += -spanX; h += -spanY;
			break;
			case 'ne':
				if (this.constrain) {
					spanY = -(spanX = Math.max(spanX, -spanY));
				}
				y += spanY;
				w += spanX; h += -spanY;
			break;
			case 'w':
				if (this.constrain) {
					spanY = spanX;
				}
				x += spanX; y += ~~(spanY / 2);
				w += -spanX; h += -spanY;
			break;
			case 'e':
				if (this.constrain) {
					spanY = spanX;
				}
				y += ~~(-spanY / 2);
				w += spanX; h += spanY;
			break;
			case 'sw':
				if (this.constrain) {
					spanX = -(spanY = Math.max(-spanX, spanY));
				}
				x += spanX;
				w += -spanX; h += spanY;
			break;
			case 's':
				if (this.constrain) {
					spanX = spanY;
				}
				x += ~~(-spanX / 2);
				w += spanX; h += spanY;
			break;
			case 'se':
				if (this.constrain) {
					spanX = spanY = Math.max(spanX, spanY);
				}
				w += spanX; h += spanY;
			break;
			default:
				console.log('error');
		}

		if ( x < minX || y < minY || w < minWidth || h < minHeight) { return; }
		if ( (maxHeight && x + w > maxWidth) || (maxHeight && y + h > maxHeight) ) { return; }

		var data = {w: w, h: h, x: x, y: y};
		node.style.cssText += tpl.replace(/\{([\w]+)\}/g, function (m, n) {return data[n];});
		node.setAttribute('xywh', [x, y, w, h].join(','));
	},
	// 获得在页面上的坐标
	getMousePosition: function (e) {
		var posx = 0;
		var posy = 0;

		var e = e || window.event;

		if (e.pageX) {
			posx = e.pageX;
			posy = e.pageY;
		} else {
			posx = e.clientX + document.documentElement.scrollLeft;
			posy = e.clinetY + document.documentElement.scrollTop;
		}

		return {x: posx, y: posy};
	},
	mouseDownHandler: function (e, handler) {
		e.stopPropagation();
		var pos = this.getMousePosition(e);
		this.lastMouseX = pos.x;
		this.lastMouseY = pos.y;
		this.lastElemWidth = this.node.clientWidth;
		this.lastElemHeight = this.node.clientHeight;
		this.lastElemLeft = this.node.offsetLeft;
		this.lastElemTop = this.node.offsetTop;
		this.isMouseDown = true;
		this.handler = handler;
		document.body.style.cursor = this.handler + '-resize';
		this.node.style.cursor = this.handler + '-resize';

		this.resizeStart && this.resizeStart();
	},
	mouseMoveHandler: function (e) {
		e.stopPropagation();
		if (this.isMouseDown) {
			this.updateSize(e);
			this.resize && this.resize();
		}
	},
	mouseUpHandler: function (e) {
		e.stopPropagation();
		if (this.isMouseDown) {
			this.isMouseDown = false;
			this.handler = null;
			document.body.style.cursor = '';
			this.node.style.cursor = '';

			this.resizeEnd && this.resizeEnd();
		}
	}
}