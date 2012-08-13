var EXPORTED_SYMBOLS = ['getDOMTree'];
Components.utils.import("resource://firecrystal/util/lib.js");

const ELEMENT_NODE = 1;
const ATTRIBUTE_NODE = 2;
const TEXT_NODE = 3;
function getDOMTree(doc,element, currUL, sourceCodeView, elementToLi) {
	if(elementToLi==null) {
		elementToLi = new Dict();
	}
	if(element.nodeType==ELEMENT_NODE) {
		var newLI = doc.createElement("LI");
		var newLIA = doc.createElement("A");
		newLIA.href = "javascript:void(0);";
		newLI.appendChild(newLIA);
		newLIA.textContent = "<"+element.tagName;
		for each(var attr in element.attributes) {
			if(attr.nodeType==ATTRIBUTE_NODE) {
				newLIA.textContent +=" "+attr.nodeName+"='"+attr.nodeValue+"'";
			}
		}
		if(elementHasChildren(element)) {
			newLIA.textContent += ">";

			var newUL = doc.createElement("UL");
			newLI.appendChild(newUL);
			for each(var child in element.childNodes) {
				getDOMTree(doc, child, newUL, sourceCodeView, elementToLi);
			}
		}
		else {
			newLIA.textContent += " />";
		}
		currUL.appendChild(newLI);
		newLIA.addEventListener("click", bind(sourceCodeView.elementClicked, sourceCodeView, element), true);
		newLIA.addEventListener("mouseover", bind(sourceCodeView.elementHoveredOver, sourceCodeView, element), true);
		newLIA.addEventListener("mouseout", bind(sourceCodeView.elementHoveredOut, sourceCodeView, element), true);
	}
	else if(element.nodeType == TEXT_NODE && creatingNodeForChild(element)) {
		var newLI = doc.createElement("LI");
		newLI.textContent = element.nodeValue;
		currUL.appendChild(newLI);
	}
	elementToLi.set(element, newLI);
	return elementToLi;
}

function creatingNodeForChild(element) {
	if(element.nodeType==ELEMENT_NODE) {
		return true;
	}
	else if(element.nodeType==TEXT_NODE) {
		return !element.nodeValue.match(/^[\n\s]*$/);
	}
	return false;
}
function elementHasChildren(element) {
	for each(var child in element.childNodes) {
		if(creatingNodeForChild(element)) {
			return true;
		}
	}
	return false;
}