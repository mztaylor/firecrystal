var EXPORTED_SYMBOLS = ['replayManagerFactory'];

Components.utils.import("resource://firecrystal/util/events.js", this);

function replayManagerFactory(fc) {
	this.currentGroup = null; // currentGroup is the last group whose actions (DOM changes, etc) have been taken into account
	this.showReplay = function() {
		Components.utils.import("resource://firecrystal/util/lib.js", this);
		
		this.model = fc.recordModelManager.currentModel;
		var windowOptions = "resizable=yes,scrollbars=yes,status=no,titlebar=no";
		var replayWindow = this.model.wdw.openDialog("chrome://browser/content/browser.xul",
														"fcsource",
														windowOptions,
														"chrome://firecrystal/content/replay/html/replayWindow.html",
														null,
														null);
																
		this.addDialogPageLoadListener(replayWindow, this.bind(this.onReplayWindowLoad, this));			
	};
	
	this.onReplayWindowLoad = function(replayWindow) {
		Components.utils.import("resource://firecrystal/replay/timeline/timeline.js", this);
		Components.utils.import("resource://firecrystal/replay/sourceCodeList/sourceCodeList.js", this);
		Components.utils.import("resource://firecrystal/replay/sourceCodeView/sourceCodeView.js", this);
		Components.utils.import("resource://firecrystal/replay/animator.js", this);
		this.locationChangeListeners = [];

		var replayDoc = replayWindow.document;
		var replayIFrame = replayDoc.getElementsByTagName("iframe")[0].contentDocument;
		
		var frames = replayIFrame.getElementsByTagName("frame");
		
		this.outputParentWindow = frames[0].contentWindow;
		this.outputIFrame = this.outputParentWindow.document.getElementById("outputIframe");
		this.outputFrame = this.outputIFrame.contentWindow;
		this.sourcesFrame = frames[1].contentWindow;

		this.codeFrame = this.sourcesFrame.document.getElementById("sourceCodeView").contentWindow;
		this.timelineFrame = replayWindow;

		this.jsFileList = this.compileJSFiles();
		this.cssFileList = this.compileCSSFiles();
				
		//Initialize the timeline
		this.timeline = new this.Timeline(this.timelineFrame, fc);
		this.timeline.addTimelineListener(this);
		this.addEventsToTimeline();
		//Done initializing the timeline
		
		//Initialize the source code viewing area
		this.sourceCodeView = new this.codeViewFactory(this.cssFileList, this.jsFileList, this.model, this.codeFrame, fc);
		//Done initializing the source code viewing area
		
		//Initialize the source code list
		this.sourceCodeList = new this.sourceCodeListFactory(this.sourceCodeView, this.jsFileList, this.sourcesFrame, this.model, fc);
		//Done initializing the source code list
		
		//Initialize the DOM output
		this.initializeOutputFrame();
		//Done initializing the DOM output
		
		this.animator = new this.animatorFactory(this.outputFrame, fc);
		
		//Timeline animator animates the events and "more info" box along the timeline
		Components.utils.import("resource://firecrystal/replay/timeline/timelineAnimator.js", this);
		this.timelineAnimator = new this.TimelineAnimator(this, replayDoc, fc);
		//end timeline animator
		
		//CSS inspector
		Components.utils.import("resource://firecrystal/replay/cssInspector.js", this);
		this.cssInspector = new this.CSSInspector(fc);
		//end CSS inspector
		
		//Take "prev" and "next" screenshots
		Components.utils.import("resource://firecrystal/replay/timeline/screenShooter.js", this);
		this.screenShooter = new this.ScreenShooter(this, fc);
		var iterableEvents = this.getIterableEvents(this.model);
		var groupedEvents = this.groupEvents(iterableEvents);
		var iterableGroups = this.getIterableGroups(groupedEvents);
		this.screenShooter.start(iterableGroups);
		//End screen shooter
	};
	
	this.addLocationChangeListener = function(listener) {
		this.locationChangeListeners.push(listener);
	}
	
	this.clearHighlightedFiles = function() {
		this.sourceCodeView.clearHighlights();
		this.sourceCodeList.clearHighlights();
	};
	
	this.highlightJSLine = function(js_event, special_highlight) {
		this.sourceCodeView.highlightJavascriptLine(js_event, special_highlight);
		this.sourceCodeList.highlightJavascriptFile(js_event, special_highlight);
	};
	
	this.compileJSFiles = function() {
		Components.utils.import("resource://firecrystal/replay/sourceFileCompiler.js", this);
		return this.compileJSLines(this.model, fc);
	};
	
	this.compileCSSFiles = function() {
		Components.utils.import("resource://firecrystal/replay/sourceCodeList/cssFileList.js", this);
		Components.utils.import("resource://firecrystal/replay/cssFile.js", this);

		var externalStyles = this.model.doc.getElementsByTagName('link');
		var cssFileList = new this.CSSFileList(fc);
		for(var i = 0; i<externalStyles.length; i++) {
			var styleTag = externalStyles[i];
			if(styleTag.rel.toLowerCase() == 'stylesheet') {
				var cssFile = new this.CSSFile(styleTag, fc);
				cssFileList.addFile(styleTag, cssFile);
			}
		}
		return cssFileList;
	};
	
	this.addEventsToTimeline = function() {
		Components.utils.import("resource://firecrystal/replay/timeline/eventProcessing.js", this);
		Components.utils.import("resource://firecrystal/replay/timeline/groupMarker.js", this);
		Components.utils.import("resource://firecrystal/replay/timeline/groupUtils.js", this);

		const ADDITIONAL_SEPERATION_MILLISECONDS = 100;
		var iterableEvents = this.getIterableEvents(this.model);
		var groupedEvents = this.groupEvents(iterableEvents);
		var iterableGroups = this.getIterableGroups(groupedEvents);
		
		this.groupMarkers = new this.Dict();
		
		var percentageDict = this.getPercentagesForGroups(iterableGroups);
		for each(var group in iterableGroups) {
			var groupMarker = new this.groupMarkerFactory(group, this.timeline, fc);
			var percentageForGroup = percentageDict.get(group);
			
			groupMarker.attachMarkerToPercentage(percentageForGroup);
			
			this.groupMarkers.set(group, groupMarker);
		}
		this.currentGroupIndex = 0;
		this.currentGroup = iterableGroups[this.currentGroupIndex];
		this.currentGroup.activated = true;
		this.percentageDict = percentageDict;
		this.iterableGroups = iterableGroups;
	};
	
	this.startInspecting = function(target) {
		var relevantGroups = this.getEventsThatAffectObject(this.outputFrame, target, this.iterableGroups, this, fc);
		this.timelineAnimator.highlightGroups(relevantGroups);
		this.objectSelect.makeRectSurroundTarget(this.outputFrame, target);
		var cssRules = this.cssInspector.inspect(target);
		this.sourceCodeList.highlightCSSRules(cssRules);
		this.sourceCodeView.highlightCSSRules(cssRules);
		this.sourceCodeView.highlightHTMLElement(target);
		this.inspecting = target;
	};
	this.stopInspecting = function() {
		this.inspecting = null;
		this.timelineAnimator.clearHighlights();
		this.sourceCodeList.clearCSSHighlights();
		this.sourceCodeView.clearCSSHighlights();
		this.sourceCodeView.clearHTMLHighlights();
	};
	
	this.initializeOutputFrame = function() {
		Components.utils.import("resource://firecrystal/replay/eventFilter.js", this);
		
		this.outputDoc = this.outputFrame.document;
		
		Components.utils.import("resource://firecrystal/replay/object_select.js", this);
		this.objectSelect = new this.objectSelectFactory(this.outputDoc, this.outputParentWindow.document, this, fc);
		this.isInspecting = false;
		
		this.outputDoc.removeChild(this.outputDoc.documentElement);
		this.outputDoc.appendChild(this.model.initialDOMClone);
		this.outputIFrame.style.width = this.model.initialDimensions.width +"px";
		this.outputIFrame.style.height = this.model.initialDimensions.height+"px";
		this.inspectButton = this.outputParentWindow.document.getElementById("inspect");
		this.inspectButton.addEventListener("click", this.bind(this.onInspectButtonClicked, this), true);
	};
	this.onInspectButtonClicked = function() {
		if(this.isInspecting) {
			this.onDeactivateInspect();
			this.objectSelect.deactivate();
		}
		else {
			this.onActivateInspect();
			this.objectSelect.activate();
		}
	};
	this.onActivateInspect = function() {
		this.isInspecting = true;
		this.inspectButton.className = "activated";
	};
	this.onDeactivateInspect = function() {
		this.isInspecting = false;
		this.inspectButton.className = "";
		this.stopInspecting();
	};
	this.onDraggedToPercentage = function(percent) {
		var bestGroup = this.getGroupClosestToPercentage(this.iterableGroups, this.percentageDict, percent);
		this.goToGroup(bestGroup);
	};
	this.onRailClicked = function() {
		//If the user is playing, we need to pause now.
		this.onPause();
		this.animator.endCurrentAnimation();
	};
	this.onMouseReleasedFromRail = function() {
		this.animateCurrentGroup();
	};
	this.onFirst = function() {
		for each(var group in this.iterableGroups) {
			if(this.canGoToGroup(group)) {
				this.goToGroup(group);
				break;
			}
		}
		this.animateCurrentGroup();
	};
	this.onPrev = function() {
		this.onPause();
		for(var i = this.currentGroupIndex-1; i>=0; i--) {
			var group = this.iterableGroups[i];
			
			if(this.canGoToGroup(group)) {
				this.goToGroup(group);
				break;
			}
		}
		this.animateCurrentGroup();
	};
	this.onPlay = function() {
		this.timeline.startedPlaying();
		var timelineWindow = this.timelineFrame;
		this.playNextFunction = function(shouldAdvance) {
			if(shouldAdvance) {
				var nextGroup = this.getNextGroup();
				if(nextGroup==null) {
					this.onPause();
					return;
				}
				else {
					this.goToGroup(nextGroup);
				}
			}
			
			var currGroup = this.currentGroup;
			var nextGroup = this.getNextGroup();
			
			if(nextGroup == null) {
				this.onPause();
				return;
			}
			
			var currentTimestamp = currGroup.timestamp;
			var nextTimestamp = nextGroup.timestamp;
			
			var timeBetween = nextTimestamp - currentTimestamp;
			
			/*fc.log("--");
			fc.log(timeBetween);
			fc.log(currGroup);
			fc.log("--");*/
			
			var boundPlayNext = this.bind(this.playNextFunction, this, true);

			this.playTimeout = this.timelineFrame.setTimeout(boundPlayNext, timeBetween);
		};
		this.playNextFunction(false);
	};
	this.onPause = function() {
		this.timeline.paused();
		if(this.playTimeout!=null) {
			this.timelineFrame.clearTimeout(this.playTimeout);
			this.playTimeout = null;
		}
	};
	this.getNextGroup = function() {
		for(var i = this.currentGroupIndex+1; i<this.iterableGroups.length; i++) {
			var group = this.iterableGroups[i];
			
			if(this.canGoToGroup(group)) {
				return group;
			}
		}
		return null;
	};
	this.onNext = function() {
		this.onPause();
		var nextGroup = this.getNextGroup();
		if(nextGroup!=null) {
			this.goToGroup(nextGroup);
		}
		this.animateCurrentGroup();
	};
	this.onLast = function() {
		this.onPause();
		for(var i = this.iterableGroups.length-1 ; i>=0; i--) {
			var group = this.iterableGroups[i];
			if(this.canGoToGroup(group)) {
				this.goToGroup(group);
				break;
			}
		}
		this.animateCurrentGroup();
	};
	this.goToGroup = function(group) {
		var lastGroupIndex = this.currentGroupIndex;
		this.currentGroup = group;
		var currentGroupIndex = this.iterableGroups.indexOf(group);
		this.currentGroupIndex = currentGroupIndex;
		var timelinePercent = this.percentageDict.get(this.currentGroup);		
		this.timeline.setPlaybackPercent(timelinePercent);
		
		this.animator.endCurrentAnimation();

		if(currentGroupIndex > lastGroupIndex) {
			for(var i = lastGroupIndex+1; i<=currentGroupIndex; i++) {
				var currGroup = this.iterableGroups[i];
				this.activateGroup(currGroup, this.model,this.outputFrame, fc);
			}
		}
		else {
			for(var i = lastGroupIndex; i>currentGroupIndex; i--) { 	
				var currGroup = this.iterableGroups[i];
				this.deactivateGroup(currGroup, this.model,this.outputFrame, fc);
			}
		}

		this.clearHighlightedJavascript(fc);
		this.highlightGroupJavascript(this.currentGroup, fc);
		
		//if(!this.groupActivatedSanityCheck) {
		//	fc.log("SANITY CHECK FAILED!! GO CRAZY!!");
		//}
		
		for each(var listener in this.locationChangeListeners) {
			listener.currentGroupChanged(group);
		}
		if(this.inspecting!=null)
			this.objectSelect.makeRectSurroundTarget(this.outputFrame, this.inspecting);
	};
	this.animateCurrentGroup = function() {
		var i;
		for(i = this.currentGroupIndex-1; i>=0; i--) {
			if(this.iterableGroups[i].type == DOM_EVENT_TYPE || this.iterableGroups[i].type == INITIAL_DOM_EVENT_TYPE) {
				break;
			}
		}
		i++;

		var toAnimate = [];
		for(; i<=this.currentGroupIndex; i++) {
			toAnimate.push(this.iterableGroups[i]);
		}
		this.animator.endCurrentAnimation();
		this.animator.currentGroup = this.currentGroup;
		this.animator.initialDeactivateFunc = this.bind(this.deactivateGroup, this, this.currentGroup, this.model, this.outputFrame,fc);
		this.animator.finalActivateFunc = this.bind(this.activateGroup, this, this.currentGroup, this.model, this.outputFrame, fc);
		this.animator.setToAnimate(toAnimate);
		this.animator.beginAnimation();
	};

	return this;
}