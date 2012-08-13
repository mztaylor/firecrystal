var EXPORTED_SYMBOLS = ['rectHighlightFactory'];

Components.utils.import("resource://firecrystal/util/lib.js");

function rectHighlightFactory(window, document, fc) {
	var TIME_INTERVAL = 20;
	var SIZE_MULTIPLIER = 0.90;
	var OPACITY_MULTIPLIER = 0.95;

	this.getHighlightDiv = function(x,y, width, height){
		var div =  document.createElement('div');
		document.body.appendChild(div);
		div.style.position = 'fixed';
		div.style.left = x+"px";
		div.style.top = y+"px";
		div.style.width = width;
		div.style.height = height;
		div.style.backgroundColor = "yellow";
		div.style.zIndex = 99999;
		div.style.MozOpacity = 0.95;
		return div;
	};
	this.animateDiv = function(div) {
		var doDecrease = function(timer_evt, div) {
			var oldWidth = div.clientWidth;
			var oldHeight = div.clientHeight;
			var newWidth = oldWidth*SIZE_MULTIPLIER;
			var newHeight = oldHeight*SIZE_MULTIPLIER;
			var xIncrease = 1;
			var yIncrease = (oldHeight-newHeight)/2;
			
			div.style.left = div.offsetLeft + xIncrease + "px";
			div.style.top = div.offsetTop + yIncrease + "px";
			div.style.width = newWidth;
			div.style.height = newHeight;
			div.style.MozOpacity *= OPACITY_MULTIPLIER;
		};
		var decreaseFunc = bind(doDecrease, this, div);
		for(var i = 0; i<100; i++) {
			window.setTimeout(decreaseFunc, TIME_INTERVAL*i);
		}
		var removeDiv = function(timer_evt, div) {
			div.parentNode.removeChild(div);
		};
		var removeFunc = bind(removeDiv, this, div);
		window.setTimeout(removeFunc, TIME_INTERVAL *i);
	};
}