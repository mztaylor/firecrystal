var EXPORTED_SYMBOLS = ['objectSelectFactory'];
Components.utils.import("resource://firecrystal/util/lib.js");

function objectSelectFactory(doc, parentDoc, replayManager, fc) {
	this.target = null;
	this.activate = function(onElementSelected) {
		var parentDocumentElement = parentDoc.documentElement;
		var documentElement = doc.documentElement;
		this.keyFunc = bind(this.keyListener, this);
		this.clickFunc = bind(this.clickListener, this);
		this.mouseOverFunc = bind(this.mouseOverListener, this);
		
		parentDocumentElement.addEventListener("keypress", this.keyFunc, true);
		documentElement.addEventListener("keypress", this.keyFunc, true);
		documentElement.addEventListener("click", this.clickFunc, true);
		documentElement.addEventListener("mouseover", this.mouseOverFunc, true);
		
		this.createRect(doc);
	};
	this.deactivate = function() {
		var parentDocumentElement = parentDoc.documentElement;
		var documentElement = doc.documentElement;
		parentDocumentElement.removeEventListener("keypress", this.keyFunc, true);
		documentElement.removeEventListener("keypress", this.keyFunc, true);
		documentElement.removeEventListener("click", this.clickFunc, true);
		documentElement.removeEventListener("mouseover", this.mouseOverFunc, true);
		
		this.keyFunc = null;
		this.clickFunc = null;
		this.mouseOverFunc = null;
		
		this.removeRect(doc);
	};

	this.keyListener = function(evt) {
		if(evt.keyCode == 13) { //Enter
			this.selectHighlightedElement();
		}
		else if(evt.keyCode == 27) { //Esc
			this.deactivate();
			replayManager.onDeactivateInspect();
		}
	};
	this.mouseOverListener = function(evt) {
		var target = evt.target;
		var rectParts = this.fetchRect(doc);
		var bdTop = rectParts.top;
		var bdBottom = rectParts.bottom;
		var bdLeft = rectParts.left;
		var bdRight = rectParts.right;
		if(target==bdTop || target == bdBottom || target==bdLeft || target==bdRight) {
			return;
		}
		this.makeRectSurroundTarget(doc.defaultView, target);
		this.target = target;
	};

	this.clickListener = function(evt) {
		this.selectHighlightedElement();
		if (evt.stopPropagation) {
			evt.stopPropagation();
			evt.preventDefault();
		}
	};
	this.selectHighlightedElement = function() {
		var rectParts = this.fetchRect(doc);
		var bdTop = rectParts.top;
		var bdBottom = rectParts.bottom;
		var bdLeft = rectParts.left;
		var bdRight = rectParts.right;
		bdTop.style.backgroundColor = bdBottom.style.backgroundColor = bdLeft.style.backgroundColor = bdRight.style.backgroundColor = "#933001";
		doc.documentElement.removeEventListener("mouseover", this.mouseOverFunc, true);
		this.mouseOverFunc = null;
		replayManager.startInspecting(this.target);
	};
	this.fetchRect = function(dc) {
		var bdTop = dc.getElementById("_fc_blockingDiv_top");
		var bdBottom = dc.getElementById("_fc_blockingDiv_bottom");
		var bdLeft = dc.getElementById("_fc_blockingDiv_left");
		var bdRight = dc.getElementById("_fc_blockingDiv_right");

		return {'top': bdTop,'bottom':bdBottom,'left':bdLeft,'right':bdRight};
	};
	this.createRect = function(dc) {
		if(dc.getElementById("_fc_blockingDiv_top")==null) {
			var blockingDiv = dc.createElement("div");
			blockingDiv.style.position="absolute";
			blockingDiv.style.backgroundColor = "#B30001";
			blockingDiv.style.visibility="hidden";
			blockingDiv.style.zIndex = 99999;
			blockingDiv.style.MozOpacity = 0.95;

			var bdTop = blockingDiv.cloneNode(true); bdTop.id = "_fc_blockingDiv_top";
			var bdBottom = blockingDiv.cloneNode(true); bdBottom.id = "_fc_blockingDiv_bottom";
			var bdLeft = blockingDiv.cloneNode(true);  bdLeft.id = "_fc_blockingDiv_left";
			var bdRight = blockingDiv.cloneNode(true); bdRight.id = "_fc_blockingDiv_right";

			dc.body.appendChild(bdTop);
			dc.body.appendChild(bdBottom);
			dc.body.appendChild(bdLeft);
			dc.body.appendChild(bdRight);
			return true;
		}
		else {
			return false;
		}
	};
	this.removeRect = function(dc) {
		var rectParts = this.fetchRect(dc);
		var bdTop = rectParts.top;
		var bdBottom = rectParts.bottom;
		var bdLeft = rectParts.left;
		var bdRight = rectParts.right;

		bdTop.style.visibility = "hidden";
		bdBottom.style.visibility = "hidden";
		bdLeft.style.visibility = "hidden";
		bdRight.style.visibility = "hidden";

		dc.body.removeChild(bdTop);
		dc.body.removeChild(bdBottom);
		dc.body.removeChild(bdLeft);
		dc.body.removeChild(bdRight);
	};
	this.makeRectSurroundTarget = function(win, target) {
		var rectParts = this.fetchRect(win.document);
		var bdTop = rectParts.top;
		var bdBottom = rectParts.bottom;
		var bdLeft = rectParts.left;
		var bdRight = rectParts.right;
		var spacing = 2;
		var borderWidth = 3;

		var rect = getRect(win, target);
		var left = rect.left;
		var top = rect.top;
		var bottom = rect.bottom;
		var right = rect.right;
		var width = right-left;
		var height = bottom-top;

		bdTop.style.visibility = "visible";
		bdTop.style.top = (top-spacing-borderWidth)+"px";
		bdTop.style.width = (width+2*spacing)+"px";
		bdTop.style.left = (left-spacing)+"px";
		bdTop.style.height = borderWidth+"px";

		bdBottom.style.visibility = "visible";
		bdBottom.style.top = (bottom+spacing)+"px";
		bdBottom.style.width = (width+2*spacing)+"px";
		bdBottom.style.left = (left-spacing)+"px";
		bdBottom.style.height = borderWidth+"px";

		bdLeft.style.visibility = "visible";
		bdLeft.style.top = (top-spacing-borderWidth)+"px";
		bdLeft.style.width = (borderWidth)+"px";
		bdLeft.style.left = (left-(spacing+borderWidth))+"px";
		bdLeft.style.height = (height+2*(spacing+borderWidth))+"px";

		bdRight.style.visibility = "visible";
		bdRight.style.top = (top-spacing-borderWidth)+"px";
		bdRight.style.width = (borderWidth)+"px";
		bdRight.style.left = (right+spacing)+"px";
		bdRight.style.height = (height+2*(spacing+borderWidth))+"px";
	};
}
