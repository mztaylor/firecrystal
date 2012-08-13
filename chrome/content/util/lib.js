var EXPORTED_SYMBOLS = ['$','Dict', 'fcDebuggerDenomralizeURL', 'bind', 'addDialogPageLoadListener', 'getPosXY',
					'absDiff', 'getRect', 'TransitionEngine', 'isSystemURL', 'screenShot'];
function $(id, doc) {
    if (doc)
        return doc.getElementById(id);
    else
        return document.getElementById(id);
}

function Dict() {
	this.keys = [];
	this.values = [];
	
	this.set = function(key, value) {
		var keyIndex = this.keyIndex(key);
		
		if(keyIndex<0) {
			this.keys.push(key);
			this.values.push(value);
		}
		else {
			this.values[keyIndex] = value;
		}
	};
	this.get = function(key) {
		var keyIndex = this.keyIndex(key);
		if(keyIndex<0) {
			return null;
		}
		else {
			return this.values[keyIndex];
		}
	};
	this.unset = function(key) {
		var keyIndex = this.keyIndex(key);
		if(keyIndex>=0) {
			this.keys = this.keys.slice(0,keyIndex).concat(this.keys.slice(keyIndex+1));
			this.values = this.values.slice(0,keyIndex).concat(this.values.slice(keyIndex+1));
		}
	};
	this.getPairs = function() {
		var rv = [];
		for(var i = 0; i<this.keys.length;i++) {
			rv+= [this.keys[i], this.values[i]];
		}
		return rv;
	};
	this.hasKey = function(key) {
		return this.keyIndex(key)>=0;
	};
	this.keyIndex = function(key) {
		for(var i = 0; i<this.keys.length; i++) {
			if(this.keys[i]==key) {
				return i;
			}
		}
		return -1;
	};
	this.getKey = function(value) {
		for(var i = 0; i<this.values.length; i++) {
			if(this.values[i]==value) {
				return this.keys[i];
			}
		}
		return -1;
	};
	this.getKeys = function() {
		return this.keys;
	};
	this.getValues = function() {
		return this.values;
	};
}

function fcDebuggerDenomralizeURL(url) {
	return url ? url.replace(/file:\/\/\//, "file:/") : "";
}
function cloneArray(array, fn) {
   var newArray = [];

   for (var i = 0; i < array.length; ++i)
       newArray.push(array[i]);

   return newArray;
}
function arrayInsert(array, index, other) {
   for (var i = 0; i < other.length; ++i)
       array.splice(i+index, 0, other[i]);

   return array;
}
function bind() {
   var args = cloneArray(arguments), fn = args.shift(), object = args.shift();
   return function() { return fn.apply(object, arrayInsert(cloneArray(args), 0, arguments)); }
}
function addDialogPageLoadListener(dialogWin, onLoad) {
	dialogWin.addEventListener("load", function(e) {
		var dialogDoc = e.target;
		var dialogDocContent = $('content', dialogDoc);
		dialogDoc.addEventListener("load", function(evt) {
			var doc = evt.target;
			var win = doc.defaultView;
			if(doc == dialogDocContent.contentDocument) {
				onLoad(win);
			}
		}, true);
	}, false);
}

function getPosXY(elt) {
	var coords = {x: 0, y: 0}, rect;

	if (elt) {
		rect=elt.getBoundingClientRect();
		coords = {x: rect.left, y: rect.top};
	}

	return coords;
};

function absDiff(a,b) {
	return Math.abs(a-b);
}
function getAbsolutePosition(win, rect) {
	return {left: rect.left + win.scrollX, right: rect.right + win.scrollX, top: rect.top + win.scrollY, bottom: rect.bottom + win.scrollY};
}
function getRect(win, obj, fc) {
	if(obj.nodeType == 3) //Text node
		obj = obj.parentNode;
	var curleft = 0;
	var curtop = 0;
	var dimensions;
	var width;
	var height;
	if(obj.getDimensions) {
		dimensions = obj.getDimensions();
		width = dimensions.width;
		height = dimensions.height;
	}
	else if(obj.getBoundingClientRect) {

		dimensions = getAbsolutePosition(win, obj.getBoundingClientRect());
		width = dimensions.right - dimensions.left;
		height = dimensions.bottom - dimensions.top;
		if(fc!=null) {
			fc.log(dimensions);
		}
	}
	else {
		width = obj.clientWidth;
		height = obj.clientHeight;
	}
	
	if(obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while(obj=obj.offsetParent);
	}
	return{'left':curleft, 'top':curtop, 'width':width, 'height':height, 'bottom': curtop + height, 'right': curleft + width};
}
function Transition(get, set, window) {
	this.start = function(to, numIntervals, totalTimeMS) {
		this.target = to;
		this.original = get();
		this.originalTargetDistance = this.target - this.original;
		
		this.totalTime = totalTimeMS;
		this.intervalsLeft = numIntervals;
		this.intervalLength = this.totalTime/this.intervalsLeft;
		this.interval = window.setInterval(bind(this.onTimeout, this), this.intervalLength);
		
		this.started = this.getMillis();
		this.ending = this.totalTime + this.started;
	};
	this.onTimeout=function() {
		var currentTime = this.getMillis();
		
		if(currentTime + this.intervalLength > this.ending || --this.intervalsLeft<=0) {
			set(this.target);
			this.stop();
		}
		else {
			var timePortion = (this.ending - currentTime)/this.totalTime;
			set(this.target - timePortion*this.originalTargetDistance);
		}
	};

	this.stop = function() {
		window.clearInterval(this.interval);
		if(this.onStop!=null) {
			this.onStop();
		}
	};
	this.getMillis = function() {
		return new Date().getTime();
	}
}

function TransitionEngine(get, set, numIntervals, totalTime, window, fc) {
	this.init = function() {
		this.currentTransition = null;
		this.directSet = set;
	};
	this.set = function(to) {
		if(this.currentTransition!=null) {
			this.currentTransition.stop();
		}
		this.currentTransition = new Transition(get,set,window);
		this.currentTransition.start(to, numIntervals, totalTime);
		this.currentTransition.onStop = bind(this.unsetCurrentTransition, this);		
	};
	this.stop = function() {		
		if(this.currentTransition!=null) {
			this.currentTransition.stop();
		}
		if(this.onStop!=null) {	
			this.onStop();
			this.onStop = null;
		}
	};
	this.unsetCurrentTransition = function() {
		this.currentTransition = null;
		if(this.onStop!=null) {	
			this.onStop();
			this.onStop = null;
		}
	};
	this.init();
}
function isSystemURL(url)
{
    if (!url) return true;
    if (url.length == 0) return true;
    if (url[0] == 'h') return false;
    if (url.substr(0, 9) == "resource:")
        return true;
    else if (url.substr(0, 17) == "chrome://firebug/")
        return true;
    else if (url  == "XPCSafeJSObjectWrapper.cpp")
        return true;
    else if (url.substr(0, 6) == "about:")
        return true;
    else if (url.indexOf("firebug-service.js") != -1)
        return true;
    else
        return false;
};

function screenShot(element,width,height, fc) {
	var wn = element.ownerDocument.defaultView;

	return takeScreenshot(wn, getRect(wn,element, fc),width,height, fc);
}

function takeScreenshot(win, rect, width, height, fc) {
	var w = rect.right - rect.left;
	var h = rect.bottom - rect.top;
	
	if(height==null && width==null) {
		width = w;
		height = h;
	}
	else if(height == null && width!=null) {
		height = h*width/w;
	}
	else if(height != null && width==null) {
		width = w*height/h;
	}
	else { //whichever dimension has to be reduced is
		var adjustedWidth = w*height/h;
		var adjustedHeight = h*width/w;
		
		if(adjustedWidth > width) {
			height=adjustedHeight;
		}
		else {
			width=adjustedWidth;
		}
	}
	
	if(width>w && height>h) {
		width = w;
		height = h;
	}

	var canvas = win.document.createElement('canvas');

	canvas.width = width;
	canvas.height = height;
	canvas.style.width = width+"px";
	canvas.style.height = height+"px";
	var ctx = canvas.getContext("2d");
	ctx.save();
	ctx.scale(width/(1.0*w), height/(1.0*h));
	ctx.drawWindow(win, rect.left, rect.top, w, h, "rgba(0,0,0,0)");
	ctx.restore();
	return canvas;
}