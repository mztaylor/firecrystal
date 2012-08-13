var EXPORTED_SYMBOLS = ['ScreenShooter'];

Components.utils.import("resource://firecrystal/util/lib.js");
Components.utils.import("resource://firecrystal/util/events.js");

function ScreenShooter(replayManager, fc) {
	this.start = function(iterableGroups) {
	/*	replayManager.onFirst();
		
		for each(var group in iterableGroups) {
			for each(var event in group.getIterable()) {
				if(event.type == DOM_EVENT_TYPE) {
					if(event.event.type == "DOMAttrModified") {
						var target = event.nextArgs[0];
						var targetClone = replayManager.model.cloneDict.get(target);
						fc.log(targetClone.getBoundingClientRect());
						fc.log(targetClone.getBoundingClientRect());

						event.prevScreenshot = screenShot(targetClone, null, null, fc);
					}
				}
				replayManager.activateEvent(event, replayManager.model, replayManager.outputFrame, fc);
				/*if(event.type == DOM_EVENT_TYPE) {
					if(event.event.type == "DOMAttrModified") {
						var target = event.nextArgs[0];
						var targetClone = replayManager.model.cloneDict.get(target);
						fc.log(targetClone);
						//event.newScreenshot = screenShot(targetClone);
					}
				}*//*
			}
			group.activated = true;
		}
		
		replayManager.currentGroupIndex = replayManager.iterableGroups.indexOf(group);
		replayManager.onFirst();
*/
	}
}