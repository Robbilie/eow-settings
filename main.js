	
	"use strict";

	Widget.initialize({
		title: "Settings",
		tabs: ["Settings", "Auto Complete", "zKillboard"],
		width: 300,
		height: 400,
	}, widget => {

		// debugging
		console.log("widget", widget);

		// create settings tab
		var settingsContent = document.createElement("h3");
			settingsContent.innerHTML = "Settings Tab Content";
		widget.setTabContent("Settings", settingsContent);

		// create test tab
		var autocompleteContent = document.createElement("webview");
			autocompleteContent.src = "https://playground.eneticum.de/search/?id=123456543";
			autocompleteContent.addEventListener("dom-ready", () => autocompleteContent.insertCSS("body, select { background-color: #131313; color: white; }"));
		widget.setTabContent("Auto Complete", autocompleteContent);

		// create zkb tab
		var zkbContent = document.createElement("webview");
			zkbContent.className = "hideof";
			zkbContent.src = "https://zkillboard.com/";
			//zkbContent.addEventListener("dom-ready", () => zkbContent.insertCSS("body, select { background-color: #131313; color: white; }"));
		widget.setTabContent("zKillboard", zkbContent);
	});
