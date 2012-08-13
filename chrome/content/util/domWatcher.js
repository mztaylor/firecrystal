var EXPORTED_SYMBOLS = ["DOMWatchFactory"];
function DOMWatchFactory(fc){
	var thisDOMWatch = this;
	this.tabBrowser=fc.browser;

	this.listeners = [];
	this.addListener = function(listener) {
		this.listeners.push(listener);
	};
	this.domChangeListener = function(evt) {
		for each(var listener in thisDOMWatch.listeners){
			listener.domChanged(evt);
		}
	};
	this.addDomChangeListeners = function(doc) {
		doc.addEventListener("DOMAttrModified", this.domChangeListener, false);
		doc.addEventListener("DOMCharacterDataModified", this.domChangeListener, false);
		doc.addEventListener("DOMNodeInserted", this.domChangeListener, false);
		doc.addEventListener("DOMNodeRemoved", this.domChangeListener, false);
	};
	this.removeDomChangeListeners = function(doc) {
		doc.removeEventListener("DOMAttrModified", this.domChangeListener, false);
		doc.removeEventListener("DOMCharacterDataModified", this.domChangeListener, false);
		doc.removeEventListener("DOMNodeInserted", this.domChangeListener, false);
		doc.removeEventListener("DOMNodeRemoved", this.domChangeListener, false);	
	};
	
	this.watchWindow = function(wdw) {
		this.addDomChangeListeners(wdw.document);
	};
	this.stopWatchingWindow = function(wdw) {
		this.removeDomChangeListeners(wdw.document);
	};
	this.addListener(fc);
	return this;
}