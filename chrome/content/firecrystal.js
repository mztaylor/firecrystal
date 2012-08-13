var FireCrystalFactory = function() {
	this.init = function() { // init gets called when the window is opened
		this.browser = getBrowser();
		this.recordingWindow = null; // The window we are recording...nothing right now
		
		//<logging>
		Components.utils.import("resource://firecrystal/util/log.js", this);
		if(window['Firebug']) {
			this.logs = this.logFactory(Firebug);
			this.log = this.logs.LOG;
			this.log1 = this.logs.LOG1;
			this.log2 = this.logs.LOG2;	
		}
		else {
			this.logs = this.logFactory(null);
			this.log = this.logs.LOG;
			this.log1 = this.logs.LOG1;
			this.log2 = this.logs.LOG2;
			this.log = this.logs.LOG1;
		}
		
		//</logging>
		
		//<state tracker>
		Components.utils.import("resource://firecrystal/util/fcStateManager.js", this);
		this.state = this.stateFactory(this);
		this.state.current = this.state.IDLE;
		this.updateRecordingIcons(); // Make sure the recording icon is blank and all
		this.addTabChangeListener(); // If we are recording and another tab is switched to, inform the user
		//</state tracker>
		
		//<page load recording>
		Components.utils.import("resource://firecrystal/util/pageLoadListener.js", this);
		this.pageLoadListenerFactory(this);
		//</page load recording>
		
		//<dom change recording>
		Components.utils.import("resource://firecrystal/util/domWatcher.js", this);
		this.domWatcher = new this.DOMWatchFactory(this);
		//</dom change recording>
		
		//<user input recording>
		Components.utils.import("resource://firecrystal/util/userInputRecorder.js",this);
		this.userInputRecorder = new this.userInputRecorderFactory(this);
		//</user input recording>
		
		//<javascript recording>
		Components.utils.import("resource://firecrystal/util/javascriptRecorder.js", this);
		this.javascriptRecorder = new this.javascriptRecorderFactory(this);
		//</javascript recording>
		
		//<model manager> - each page will have its own model to store events, and the model manager manages & distributes events
		// to the appropriate model
		Components.utils.import("resource://firecrystal/record/recordModelManager.js", this);
		this.recordModelManager = new this.recordModelManagerFactory(this);
		//</model manager>
		
		//<replay window>
		Components.utils.import("resource://firecrystal/replay/replayManager.js", this);
		this.replayManager = new this.replayManagerFactory(this);
		//</replay window>
		
	};
	this.locationChanged = function(wdw) { // Called before load, when user changes locations or switches tabs		
		if(this.state.current == this.state.WAITING_TO_RECORD_AFTER_RELOAD) {
			this.state.current = this.state.RECORDING;
			this.onRecord(this.recordingWindow);
			this.updateRecordingIcons();
		}
	};
	this.load = function(loadedWindow) { // Load gets called whenever there is a new page load
	};
	this.onToolbarIconClick = function() { // onToolbarIconClick gets called with the "record" button is hit
		if(this.state.current == this.state.IDLE) { // Time to start recording!
			var retVals = {'reload': false, 'canceled': true};
			window.openDialog("chrome://firecrystal/content/dialogs/recordOptionsDialog.xul","fcinitialoptions", "resizable=no,modal=yes", retVals);
			//var retVals = {'reload': false, 'canceled': false};
			if(!retVals.canceled) {
				this.recordingWindow = this.getCurrentWindow();
				if(retVals.reload) {
					this.state.current = this.state.WAITING_TO_RECORD_AFTER_RELOAD;
					this.browser.selectedTab.linkedBrowser.reload();
				}
				else {					
					this.state.current = this.state.RECORDING;
					this.onRecord(this.recordingWindow);
				}
			}
		}
		else if(this.state.current == this.state.RECORDING) {			
			this.state.current = this.state.IDLE;
			this.onStopRecording();
		}
		this.updateRecordingIcons();
	};
	this.onRecord = function(wdw) {
		this.recordModelManager.onRecordWindow(wdw);
		this.startListeningToWindow(wdw);
	};
	this.onStopRecording = function() {
		this.stopListeningToWindow(this.recordingWindow);
		this.recordingWindow = null;
		this.replayManager.showReplay();
		window.minimize();
	};
	this.updateRecordingIcons = function() { // update the record button to reflect the actual current state
		var statusIcon = document.getElementById("FireCrystal_StatusIcon");
		var statusText = document.getElementById("FireCrystal_StatusText");
		
		if(this.state.current == this.state.IDLE) {
			statusIcon.setAttribute("fcs", "off");
			statusText.setAttribute("value", "FireCrystal");
		}
		else if(this.state.current == this.state.RECORDING) {
			statusIcon.setAttribute("fcs", "on");
			var focusedWindow = this.getCurrentWindow();
			if(focusedWindow == this.recordingWindow) { // Check to see if another tab is being recorded
				statusText.setAttribute("value", "Recording");
			}
			else {
				statusText.setAttribute("value", "Recording (another tab)");
			}
		}
	};
	this.startListeningToWindow = function(wdw) {
		this.userInputRecorder.recordWindow(wdw);
		this.domWatcher.watchWindow(wdw);
		this.javascriptRecorder.startListening();
	};
	this.stopListeningToWindow = function(wdw) {
		this.userInputRecorder.stopRecordingWindow(wdw);
		this.domWatcher.stopWatchingWindow(wdw);
		this.javascriptRecorder.stopListening();
	};
	this.getCurrentWindow = function() {
		return this.browser.selectedTab.linkedBrowser.contentWindow;
	};
	this.addTabChangeListener = function() {
		var thisFC = this;
		this.browser.mTabContainer.addEventListener('select', function(evt) {
			thisFC.updateRecordingIcons();
		}, false);
	};
	this.userInput = function(evt) {		
		this.recordModelManager.onUserInput(evt);
	};
	this.domChanged = function(evt) { // domChanged gets called whenever the page DOM was changed
		this.recordModelManager.onDomChange(evt);
	};
	this.jsLineRun = function(frame, type, val) {
		this.log1(frame.script.fileName);
		this.recordModelManager.onJavascriptLineExecuted(frame, type, val);
	};
	this.exit = function() { // exit gets called when the window is closed
	};
};

var FireCrystal = new FireCrystalFactory();

window.addEventListener("load", function() { // Trigger the init function when the window loads
									if(window.name!="fcpage" && window.name != "fcsource" &&
									 window.name != "fcinitialoptions" && window.name != "fcelementpicker") {
										FireCrystal.init();
									}
								}, false);
window.addEventListener("unload", function() { // Trigger the exit function when the window closes
									if(window.name!="fcpage" && window.name != "fcsource" && 
									 window.name != "fcinitialoptions" && window.name != "fcelementpicker") {
										FireCrystal.exit();
									}
								}, false);