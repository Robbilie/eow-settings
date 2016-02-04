	
	"use strict";

	Widget.initialize({
		title: "EOW Settings"
	}, widget => {

		// debugging
		console.log("widget", widget);

		widget.tabs.addTab("Settings", eowEl("div", { className: "pad" })
			.appendChildren([
				eowEl("input", { placeholder: "Github Access Token", value: (Widget.loadData("accesstoken") || "") }).on("input", function () { Widget.storeData("accesstoken", this.value); }),
				eowEl("button", { innerHTML: "Load Repositories" }).on("click", () => loadRepositoryList(updateList)),
				eowEl("ul", { id: "repolist" })
			])
		);

		// close app if settings are closed
		widget.bw.on("close", () => remote.app.quit());

		widget.tabs.selectTab("Settings");

		updateCore();
		loadRepositoryList(updateList);

		Object.keys(Widget.loadData("windows") || {}).map(windowID => openWidget(windowID));


		function updateList (list) {
			eowEl($("#repolist"))
				.clear()
				.appendChildren(list.map(item => 
					eowEl("li")
						.appendChildren([
							eowEl("h3", { innerHTML: item.name }),
							eowEl("p", { innerHTML: item.description }),
							eowEl("button", { innerHTML: `Open ${item.name}` }).on("click", () => {
								openWidget(
									Widget.saveWidget(
										Widget.createWidgetData({ urls: [item.repository.url] })
									)["id"]
								);
							})
						])
				));
		}

		function openWidget (windowID) {
			remote.require("./main.js").loadWidget(windowID);
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

		function updateCore () {
			var modes = require('js-git/lib/modes');
			var fs = require("fs");
			var localpackage = JSON.parse(fs.readFileSync("package.json"));
			var repo = {};
			var githubName = "Robbilie/eow-core";
			var githubToken = Widget.loadData("accesstoken");
			
			require('js-github/mixins/github-db')(repo, githubName, githubToken);
			require('js-git/mixins/create-tree')(repo);
			require('js-git/mixins/mem-cache')(repo);
			require('js-git/mixins/read-combiner')(repo);
			require('js-git/mixins/formats')(repo);

			repo.readRef("refs/heads/master", (err, headHash) => {
				repo.loadAs("commit", headHash, (err, commit) => {
					repo.loadAs("tree", commit.tree, (err, tree) => {
						repo.loadAs("text", tree["package.json"].hash, (err, fdata) => {
							var coredata = JSON.parse(fdata);
							console.log(coredata);
							console.log(tree);

							var cnt = 0;

							var storeTree = (path, tree) => {
								cnt += Object.keys(tree).length;
								// create path if non existant
								try {
									console.log("writing path: " + path);
									fs.mkdirSync(path);
								} catch (e) {}

								for(var f in tree) {
									if(modes.isFile(tree[f].mode)) {
										saveFile(repo, tree[f].hash, path + "/" + f, modes.isBlob(tree[f].mode) ? "blob" : "text");
									} else if(modes.toType(tree[f].mode) == "tree") {
										loadTree(repo, tree[f].hash, path + "/" + f);
									}
								}
							};

							var saveFile = (repo, hash, name, type) => {
								repo.loadAs(type, hash, (err, fdata) => {
									console.log("writing " + type + ": " + name);
									fs.writeFileSync(name, fdata);
									cnt--;
									isDone();
								});
							};

							var loadTree = (repo, hash, path) => {
								repo.loadAs("tree", hash, (err, tree) => {
									storeTree(path, tree);
									cnt--;
									isDone();
								});
							};

							var done = false;
							var isDone = () => {
								if(cnt === 0) {
									console.log("finally done");
									alert("Successfully updated EOW. Restart for changes to take effect.");
								}
							};


							if(coredata.version > localpackage.version) {
								storeTree(".", tree);
							}
						});
					});
				});
			});
		}
	});