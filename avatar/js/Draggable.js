/*!
 * Draggable @autor Super Blade @update 2014-10-23
 * *node {String} 
 * handlers {String}  触发
 * container {String} 限制范围，true为父级定位元素
 * compensate {Array} 宽高补偿，主要考虑border
 * resizeStart {Function} mousedown时触发
 * resize {Function} mousemove时触发
 * resizeEnd {Function} mouseup时触发
 * TODO IE 
*/

function Draggable(opt) {
	if (!(this instanceof Draggable)) {
		return new Draggable(opt);
	}
	this.node = document.querySelector(opt.node);
	this.handler = this.node.querySelector(opt.handler) || this.node;
	this.container = opt.container || this.node.offsetParent;
	this.compensate = opt.compensate || [this.node.clientLeft * 2, this.node.clientTop * 2];

	if (opt.container) {
		this.container = opt.container === true ? (this.node.offsetParent === null ? document.body : this.node.offsetParent) : opt.container;
		this.minX = opt.minY || 0;
		this.minY = opt.minX || 0;
		this.maxWidth = opt.maxX || this.container.clientWidth - this.compensate[0];
		this.maxHeight = opt.maxY || this.container.clientHeight - this.compensate[1];
	} else {
		this.minX = opt.minX;
		this.minY = opt.minY;
		this.maxWidth = opt.maxX;
		this.maxHeight = opt.maxY;
	}

	this.dragStart = opt.dragStart;
	this.drag = opt.drag;
	this.dragEnd = opt.dragEnd;
	this.init();
}

Draggable.prototype = {
	constructor: Draggable,
	init: function () {
		this.isMouseDown = false;
		this.lastMouseX = 0;
		this.lastMouseY = 0;
		this.lastElemLeft = 0;
		this.lastElemTop = 0;
		this.initEvent();
	},
	initEvent: function () {
		var self = this, node = this.node, handler = this.handler;
		handler.addEventListener('mousedown', function (e) {
			self.mouseDownHandler(e);
		}, false);
		document.addEventListener('mousemove', function(e) {
			self.mouseMoveHandler(e);
		}, false);

		document.addEventListener('mouseup', function(e) {
			self.mouseUpHandler(e);
		}, false);

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
	updatePosition: function (e) {
		var pos = this.getMousePosition(e);
		var node = this.node;
		var spanX = pos.x - this.lastMouseX;
		var spanY = pos.y - this.lastMouseY;
		var minX = this.minX, minY = this.minY,
			maxX = this.maxX, maxY = this.maxY;

		var x = this.lastElemLeft + spanX;
		var y = this.lastElemTop + spanY;
		var w = this.lastElemWidth;
		var h = this.lastElemHeight;

		if (this.container) {
			x = x <= minX ? minX : (x >= maxX ? maxX : x);
			y = y <= minY ? minY : (y >= maxY ? maxY : y);
		}

		var data = {w: w, h: h, x: x, y: y};
		node.style.cssText += 'left:'+ x +'px;top:'+ y +'px;';
		node.setAttribute('xywh', [x, y, w, h].join(','));
	},
	mouseDownHandler: function (e, handler) {
		e.stopPropagation();
		var pos = this.getMousePosition(e);
		this.lastMouseX = pos.x;
		this.lastMouseY = pos.y;
		this.lastElemLeft = this.node.offsetLeft;
		this.lastElemTop = this.node.offsetTop;
		this.lastElemWidth = this.node.clientWidth;
		this.lastElemHeight = this.node.clientHeight;
		this.maxX = this.maxWidth - this.lastElemWidth;
		this.maxY = this.maxHeight - this.lastElemHeight;
		this.isMouseDown = true;

		this.dragStart && this.dragStart();
	},
	mouseMoveHandler: function (e) {
		e.stopPropagation();
		if (this.isMouseDown) {
			this.updatePosition(e);
			this.drag && this.drag();
		}
	},
	mouseUpHandler: function (e) {
		e.stopPropagation();
		if (this.isMouseDown) {
			this.isMouseDown = false;
			this.dragEnd && this.dragEnd();
		}
	}
}