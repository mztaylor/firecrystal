var EXPORTED_SYMBOLS = ["Timeline"];

Components.utils.import("resource://firecrystal/util/lib.js");

var Timeline = function(wdw, fc) {
	this.state = {
		IDLE:0,
		DRAGGING:1,
		mouseOver:false,
		playing:false,
	};
	
	this.state.current = this.state.IDLE; // Whether or not we are dragging the handle
	this.listeners = []; // Whoever wants to know when "next", "prev", etc. are clicked
	this.eventMarkers = []; // The markers showing each event
	this.percent = 0.0; // The current percentage of playback done
	
	this.doc = wdw.document;
	
	this.init = function() {
		this.handle = this.doc.getElementById("handle"); 
		this.handleWidth = this.handle.clientWidth;
		
		this.rail = this.handle.parentNode;	
		
		this.rail.addEventListener("mouseover", bind(this.onRailMouseOver, this), true);	
		this.rail.addEventListener("mousedown", bind(this.onRailMouseDown, this), false);
		this.doc.addEventListener("mousemove", bind(this.onDocMouseMove, this), true);
		this.doc.addEventListener("mouseup", bind(this.onDocMouseUp, this), true);
		this.rail.addEventListener("mouseout", bind(this.onRailMouseOut, this), true);
		this.doc.addEventListener("mouseout", bind(this.onDocMouseOut, this), true);
		
		this.playButton = this.doc.getElementById("play"); //Special for play button because this might be play OR pause
		this.playButton.addEventListener("click", bind(this.onPlayOrPause, this), true);
		
		wdw.addEventListener("resize", bind(this.onWindowResize, this),true);
		
		this.doc.documentElement.style.MozUserSelect="none";
		this.updateHandleLocation();
		
		this.onRailMouseOut(); // Set the handle to its normal color
		this.onWindowResize();
	};
	this.addTimelineListener = function(listener) {
		var nextButton = this.doc.getElementById("next");
		nextButton.addEventListener("click", bind(listener.onNext, listener), true);
		var prevButton = this.doc.getElementById("previous");
		prevButton.addEventListener("click", bind(listener.onPrev, listener), true);
		var firstButton = this.doc.getElementById("first");
		firstButton.addEventListener("click", bind(listener.onFirst, listener), true);
		var lastButton = this.doc.getElementById("last");
		lastButton.addEventListener("click", bind(listener.onLast, listener), true);
		this.listeners.push(listener);
	};
	this.onPlayOrPause = function(evt) {
		if(this.state.playing) {
			for each(var listener in this.listeners) {
				listener.onPause();
			}
		}
		else {
			for each(var listener in this.listeners) {
				listener.onPlay();
			}	
		}
	};
	this.onRailMouseOver = function(evt) {
		this.state.mouseOver = true;
		if(this.state.current == this.state.IDLE) {
			this.handle.className = "hover";
		}
	};
	this.onRailMouseDown = function(evt) {
		this.xGrab = this.handleWidth/2;

		for each(var listener in this.listeners) {
			listener.onRailClicked();
		}
		this.startDraggingHandle();
		this.handleMove(evt.clientX);
	};
	this.onDocMouseMove = function(evt) {
		if(this.state.current == this.state.DRAGGING) {
			this.handleMove(evt.clientX);	
		}
	};
	this.onDocMouseUp = function(evt) {
		if(this.state.current == this.state.DRAGGING) {
			this.stopDraggingHandle();
			for each(var listener in this.listeners) {
				listener.onDraggedToPercentage(this.percent);
			}
			for each(var listener in this.listeners) {
				listener.onMouseReleasedFromRail();
			}
		}
	};
	this.onRailMouseOut = function(evt) {
		this.state.mouseIsOver = false;
		if(this.state.current == this.state.IDLE) {
			this.handle.className = "idle";
		}	
	};
	this.onDocMouseOut = function(evt) {
		if(evt.target.tagName == "HTML") {
			this.stopDraggingHandle();		
		}	
	};
	
	this.onWindowResize = function(evt) {
		var replayTR = this.doc.getElementById("replayView");
		var timeline = this.doc.getElementById("timeline");
		var timelineHeight = timeline.clientHeight;
	
		replayTR.style.height = (wdw.innerHeight-timelineHeight-1)+"px";
		this.updateHandleLocation();
	};

	this.startDraggingHandle = function(xGrab) {
		this.state.current = this.state.DRAGGING;
		this.handle.className = "clicked";
	};
	this.stopDraggingHandle = function(handle) {
		this.state.current = this.state.IDLE;
		if(this.state.mouseOver) {
			this.onRailMouseOver();
		}
		else {
			this.onRailMouseOut();
		}
	};
	this.handleMove = function(x) {
		var railX = findPos(this.rail)[0];
		var railWidth = this.getRailWidth();
		var newHandleLeft = (x - railX - this.xGrab);

	 	if(newHandleLeft < 0) {
			newHandleLeft = 0;
		}
		if(this.handleWidth + newHandleLeft > railWidth) {
			newHandleLeft = railWidth - this.handleWidth;
		}
		this.handle.style.left = newHandleLeft +"px";
		
		this.percent = newHandleLeft/(1.0*railWidth - this.handleWidth);
		for each(var listener in this.listeners) {
			listener.onDraggedToPercentage(this.percent);
		}
	};

	this.setPlaybackPercent = function(percentage) {
		if(this.state.current != this.state.DRAGGING) { //If we are dragging, we might get stuck in an infinite loop
			this.percentage = percentage;
			this.updateHandleLocation();
		}
	};
	
	this.updateHandleLocation = function() {
		this.handle.style.left = (this.percentage*(this.getRailWidth() - this.handleWidth))+"px";
	};
	this.getRailWidth = function() {
		return this.rail.clientWidth;
	};
	
	this.addEventMarker = function(changeLocation) {
		var doc = wdw.document;
		var type = getEventType(changeLocation.event);
		this.eventMarkers.push(new EventMarker(doc, changeLocation.percent, getMarkerForType(doc, type), type));
	};
	
	this.getHandleWidth = function() {
		return this.handle.clientWidth;
	};
	
	this.startedPlaying = function() {
		this.setPlayIconTo("images/timeline/media-playback-pause.png");
		this.state.playing = true;
	};
	
	this.paused = function() {
		this.setPlayIconTo("images/timeline/media-playback-start.png");
		this.state.playing = false;
	};
	
	this.setPlayIconTo = function(filename) {
		this.playButton.getElementsByTagName("img")[0].src = filename;
	};
	
	this.init();
};
function findPos(obj) {
	var curleft = 0;
	var curtop = 0;
	if(obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while(obj=obj.offsetParent);
		return [curleft,curtop];
	}
	return[0,0];
}