var EXPORTED_SYMBOLS = ['cloneNode', 'domEventFactory'];
Components.utils.import("resource://firecrystal/util/events.js");
Components.utils.import("resource://firecrystal/util/lib.js");

function cloneNode(toClone, onCloneFunc, fc) { //onCloneFunc is called on each clone
	function cloneNodeHelper(node) {
		var clone = node.cloneNode(false);
		if(onCloneFunc!=null) {
			onCloneFunc(clone, node);
		}

		if(node.tagName=="LINK") { //Fix relative link locations like stylesheets
			clone.setAttribute('href', node.href); //href is now the full href
		}
		else if(node.tagName == "STYLE") {
			clone.innerHTML = node.innerHTML.replace(/([0-9a-zA-Z.\/]+\.css)/, node.ownerDocument.defaultView.location.href+"$1");
		}
		for each(var childNode in node.childNodes) {
			clone.appendChild(cloneNodeHelper(childNode));
		}
		return clone;
	}
	return cloneNodeHelper(toClone);
}

function domEventFactory(evt, model, fc) {
	var retFunctions = {};
	var relevantElement = evt.target;
	if(evt.type=="DOMAttrModified") {
		var target = evt.target;
		var targetReferenceClone = model.referenceClone.getCloneOf(target);
		
		var attrName = evt.attrName;
		var nValue = target.getAttribute(attrName);
		var pValue = targetReferenceClone.getAttribute(attrName);
		
		var nextArgs = [target];
		var prevArgs = [target];
		
		retFunctions.next = bind(function(clonedNode, attributeName, newValue) {
			clonedNode.setAttribute(attributeName, newValue);
		}, this,attrName, nValue);
		retFunctions.prev = bind(function(clonedNode, attributeName, prevValue) {
			clonedNode.setAttribute(attributeName, prevValue);
		}, this,attrName, pValue);
		retFunctions.property = attrName;
		retFunctions.prevValue = pValue;
		retFunctions.newValue = nValue;

		retFunctions.newSShot = screenShot(target);
	}
	else if(evt.type=="DOMNodeInserted") {
		var target = evt.target;		
		var parent = evt.relatedNode;
		var insertedBefore = target.nextSibling;
		
		if(!model.cloneDict.hasKey(target)) {
			var onCloneFunc = function(clone, node) {
				this.cloneDict.set(node, clone);
			};
			cloneNode(target, bind(onCloneFunc, model));
		}
		
		var nextArgs = [target, parent, insertedBefore];
		var prevArgs = [target, parent];
		retFunctions.next = bind(function(clonedTarget, clonedParent, clonedInsertedBefore) {
			clonedParent.insertBefore(clonedTarget, clonedInsertedBefore);
		}, this);
		retFunctions.prev = bind(function(clonedTarget, clonedParent) {
			clonedParent.removeChild(clonedTarget);
		}, this);
		retFunctions.target = target;

		retFunctions.sshot = screenShot(target);
	}
	else if(evt.type == "DOMNodeRemoved") {
		var target = evt.target;
		var parent = evt.relatedNode;
		var wasBefore = model.referenceClone.getNextSibling(target);
		
		var nextArgs = [target, parent];
		var prevArgs = [target, parent, wasBefore];

		retFunctions.next = bind(function(clonedTarget, clonedParent) {
			clonedParent.removeChild(clonedTarget);
		}, this);
		retFunctions.prev = bind(function(clonedTarget, clonedParent, clonedInsertBefore) {
			clonedParent.insertBefore(clonedTarget, clonedInsertBefore);
		}, this);
		retFunctions.target = target;

		retFunctions.sshot = screenShot(target);
	}
	else if(evt.type == "DOMCharacterDataModified") {
		var target = evt.target;

		if(!model.cloneDict.hasKey(target)) {
			var targetParent = target.parentNode
			var newValue = evt.newValue;
			var prevValue = evt.prevValue;
			
			var onCloneFunc = function(clone, node) {
				this.cloneDict.set(node, clone);
			};
			cloneNode(target, bind(onCloneFunc, model));
			var nextArgs = [target, targetParent];
			var prevArgs = [target, targetParent];
			retFunctions.next = bind(function(clonedTarget, clonedParent, newValue){
				clonedParent.textContent = newValue;
				clonedParent.appendChild(clonedTarget);
			}, this, newValue);
			retFunctions.prev = bind(function(clonedTarget, clonedParent, prevValue){
				clonedParent.removeChild(clonedTarget);
				clonedParent.textContent = prevValue;
			}, this, prevValue);
		}
		else {
			var clone = model.cloneDict.get(target);
			var newValue = target.textContent;
			var prevValue = evt.prevValue;

			var nextArgs = [target];
			var prevArgs = [target];
			retFunctions.next = bind(function(clonedTarget, newValue){
				clonedTarget.textContent = newValue;
			}, this, newValue);
			retFunctions.prev = bind(function(clonedTarget, prevValue){
				clonedTarget.textContent = prevValue;
			}, this, prevValue);
		}
	}
	else {
		fc.log("Unhandled DOM event type: " + evt.type);
	}
	
	return new DOMChangeEvent(retFunctions, evt, nextArgs, prevArgs);
}