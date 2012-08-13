var EXPORTED_SYMBOLS = ['animatorFactory']

Components.utils.import("resource://firecrystal/util/lib.js");
Components.utils.import("resource://firecrystal/util/events.js");
Components.utils.import("resource://firecrystal/replay/ripple.js");
Components.utils.import("resource://firecrystal/replay/recthighlight.js");


function animatorFactory(wdw, fc) {
	const ANIMATION_DELAY = 20;
	this.wdw = wdw;
	this.doc = this.wdw.document;
	this.body = this.doc.body;

	this.initialDeactivateFunc = null;
	this.finalActivateFunc = null;
	this.toAnimate = [];
	var Ripple = RippleFactory(this.wdw, this.doc);
	this.rectHighlight = new rectHighlightFactory(this.wdw, this.doc, fc);

	
	this.setToAnimate = function(groups) {
		this.toAnimate = [];
		for(var i = groups.length-1; i>=0; i--) {
			var currIterable = groups[i].getIterable();
			for(var j = currIterable.length-1; j>=0; j--) {
				var currEvent = currIterable[j];
				if(currEvent.type == UI_EVENT_TYPE)
					this.toAnimate.push(currIterable[j]);
			}
		}
	};
	
	this.endCurrentAnimation = function() {
		this.toAnimate = [];
		if(this.initialDeactivateFunc!=null) {
			this.initialDeactivateFunc();
			this.initialDeactivateFunc=null;
		}
		if(this.finalActivateFunc!=null) {
			this.finalActivateFunc();
			this.finalActivateFunc=null;
		}
	};
	this.beginAnimation = function() {
		if(this.initialDeactivateFunc!=null) {
			this.initialDeactivateFunc();
			this.initialDeactivateFunc=null;
		}
		this.advanceAnimation();
	};
	this.getDOMChanges = function(group) {
		var rv = [];
		for each(var event in group.getIterable()) {
			if(event.type == DOM_EVENT_TYPE) {
				rv.push(event);
			}
		}
		return rv;
	};
	
	this.advanceAnimation = function() {
		var currToAnimate = this.toAnimate.pop();
		if(currToAnimate==null) {
			this.endCurrentAnimation();
			if(this.currentGroup!=null) {
				if(this.currentGroup.type == DOM_EVENT_TYPE) {
					var domChanges = this.getDOMChanges(this.currentGroup);
					for each(var domEvent in domChanges) {
						if(domEvent.event.type == "DOMNodeInserted" || domEvent.event.type == "DOMAttrModified") {
							var target = fc.replayManager.model.cloneDict.get(domEvent.event.target);
							if(target.nodeType == 3) { //Text node
								target = target.parentNode;
							}
							
							var boundingRect = getRect(this.wdw,target);
							var div = this.rectHighlight.getHighlightDiv(boundingRect.left, boundingRect.top,
																		boundingRect.width, boundingRect.height);
							this.body.appendChild(div);
							this.rectHighlight.animateDiv(div);
						}
					}
				}
				this.currentGroup = null;
			}
		}
		else {
			this.animateEvent(currToAnimate);
		}
	};
	this.animateEvent = function(event) {
		const NUM_VISIBLE_CURSORS = 4;
		if(event.type == UI_EVENT_TYPE) {
			var evt = event.evt;

			
			if(evt.type == "mousedown") {
				Ripple.makeNewRipple(evt.pageX, evt.pageY);
			}
			if(evt.type == "mouseup") {
				Ripple.makeNewRipple(evt.pageX, evt.pageY);
			}
			if(evt.type == "mousemove" || evt.type == "mousedown" || evt.type == "mouseup") {
				var mouseCursor = this.getMouseCursorImage();
				
				mouseCursor.style.left = evt.pageX+"px";
				mouseCursor.style.top = evt.pageY+"px";
				this.body.appendChild(mouseCursor);
			
				var nextFunc = function(timeout_evt, cursor) {
					this.body.removeChild(cursor);
				};
				this.wdw.setTimeout(bind(nextFunc, this, mouseCursor), ANIMATION_DELAY*NUM_VISIBLE_CURSORS);
				this.wdw.setTimeout(bind(this.advanceAnimation, this), ANIMATION_DELAY);
				return;
			}
		}
		this.wdw.setTimeout(bind(this.advanceAnimation, this), ANIMATION_DELAY);
		
	};
	this.getMouseCursorImage = function() {
		var theDiv = this.doc.createElement("div");
		theDiv.style.zIndex = "1410065407";
		theDiv.style.position = "absolute";
		theDiv.style.visibility = "visible";

		var img = this.doc.createElement("img");
		img.src = "images/cursor.png";
		theDiv.appendChild(img);
		return theDiv;
	};
}