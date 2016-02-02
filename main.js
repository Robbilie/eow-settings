	
	"use strict";

	Widget.initialize({
		title: "Settings",
		tabs: ["Settings", "Auto Complete", "zKillboard"],
		width: 300,
		height: 400,
	}, widget => {

		// debugging
		console.log("widget", widget);

		var loadWidget = require("remote").require("./main.js").loadWidget;

		loadRepositoryList(list => {
			// create settings tab
			widget.setTabContent("Settings", 
				eowEl("div")
					.appendChildren([
						eowEl("h3", { innerHTML: "Settings" }),
						eowEl("input"),
						eowEl("ul")
							.appendChildren(list.map(item => 
								eowEl("li")
									.appendChildren([
										eowEl("h4", { innerHTML: item.name }),
										eowEl("h5", { innerHTML: item.description }),
										eowEl("button", { value: `Install ${item.name}` }).on("click", () => loadWidget(item.repository.url))
									])
							))
					])
			);
		});

		// create test tab

		widget.setTabContent("Auto Complete",
			eowEl("webview", { 
				src: "https://playground.eneticum.de/search/?id=123456543" 
			})
			.on("dom-ready", function () { this.insertCSS("body, select { background-color: #131313; color: white; }"); })
		);

		// create zkb tab
		widget.setTabContent("zKillboard", eowEl("webview", {
			src: "https://zkillboard.com/",
			className: "hideof"
		}));
	});

	function loadRepositoryList (cb) {
		var repo = {};
		var githubName = "Robbilie/eow-repository";
		var githubToken = "a206b5c8a752122302774ccf8030f08d15bdd1dc";
		
		require('js-github/mixins/github-db')(repo, githubName);
		require('js-git/mixins/create-tree')(repo);
		require('js-git/mixins/mem-cache')(repo);
		require('js-git/mixins/read-combiner')(repo);
		require('js-git/mixins/formats')(repo);

		repo.readRef("refs/heads/master", (err, headHash) => {
			repo.loadAs("commit", headHash, (err, commit) => {
				repo.loadAs("tree", commit.tree, (err, tree) => {
					repo.loadAs("text", tree["index.json"].hash, (err, fdata) => {
						var list = JSON.parse(fdata);
						cb(list);
					});
				});
			});
		});
	}