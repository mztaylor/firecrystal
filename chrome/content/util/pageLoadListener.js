var EXPORTED_SYMBOLS = ["pageLoadListenerFactory"];
var Cc = Components.classes; var Ci = Components.interfaces;
function pageLoadListenerFactory(fc) {
	this.progressListener = {
		_WPL: Ci.nsIWebProgressListener,
		getObserver: function() {
			return Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		},
		QueryInterface: function(aIID) {
			if(aIID.equals(Ci.nsIWebProgressListener) || 
			aIId.equals(Ci.nsISupportsWeakReference) ||
			aIId.equals(Ci.nsISupports))
				return this;
			throw Components.results.NS_NOINTERFACE;
		},
		onLinkIconAvailable: function(a){},
		onLocationChange: function(aWebProgress, aRequest, aLocation) {
			var wdw = aWebProgress.DOMWindow;
			
			fc.locationChanged(wdw);
		},
		onProgressChange: function(){},
		onSecurityChange: function(){},
		onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus) {
			if(aStateFlags & this._WPL.STATE_STOP) {
				if(aStateFlags & this._WPL.STATE_IS_NETWORK) {
					fc.load(aWebProgress.DOMWindow);
				}
			}
		}
	};
	
	fc.browser.addProgressListener(this.progressListener);
}