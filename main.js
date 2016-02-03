	
	"use strict";

	Widget.initialize({
		title: "Settings",
		width: 300,
		height: 400,
		controls: ["pin", "size"]
	}, widget => {

		// debugging
		console.log("widget", widget);

		var tabs = eowTabs("div", {}, [{
			name: "Settings",
			content: [
				eowEl("div", { className: "pad" })
					.appendChildren([
						eowEl("input", { placeholder: "Github Access Token", value: (Widget.loadData("accesstoken") || "") }).on("input", function () { Widget.storeData("accesstoken", this.value); }),
						eowEl("button", { innerHTML: "Load Repositories" }).on("click", () => loadRepositoryList(updateList)),
						eowEl("ul", { id: "repolist" })
					])
			]
		}]);

		widget.appendChild(tabs);

		tabs.selectTab("Settings");

		loadRepositoryList(updateList);

		function updateList (list) {
			eowEl($("#repolist"))
				.clear()
				.appendChildren(list.map(item => 
					eowEl("li")
						.appendChildren([
							eowEl("h3", { innerHTML: item.name }),
							eowEl("p", { innerHTML: item.description }),
							eowEl("button", { innerHTML: `Open ${item.name}` }).on("click", () => openWidget(item.repository.url))
						])
				));
		}

		function openWidget (url) {
			var loadWidget = require("remote").require("./main.js").loadWidget;
			var windows = Widget.loadData("windows");
			if(!windows) windows = [];
			if(windows.indexOf(url) < 0) {
				windows.push(url);
				Widget.storeData("windows", windows);
			}
			loadWidget(url);
		}

		function loadRepositoryList (cb) {
			var repo = {};
			var githubName = "Robbilie/eow-repository";
			var githubToken = Widget.loadData("accesstoken");
			
			require('js-github/mixins/github-db')(repo, githubName, githubToken);
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
	});