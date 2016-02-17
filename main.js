
	"use strict";

	Widget.INSTANCE.loadPlugin({
		title: "Settings",
		name: "Robbilie/eow-settings"
	}, plugin => {

		// debugging
		console.log("plugin", plugin);
		
		var setTheme = e => {
			let windows = remote.require("./main.js").getWindows();
			Object
				.keys(windows)
				.map(k => windows[k].webContents.send("loadTheme", { 
					theme: 		themeSelect.getSelected(),
					opacity: 	themeOpacity.value / 100
				}));
		};

		var themeSelect = eowDropdown({}).on("toggle", setTheme);

		var themeOpacity = eowRange({ min: 0, max: 100, value: 50 }).on("input", setTheme);
		
		Object.keys(Widget.THEMES).map(k => themeSelect.addOption(k));
		themeSelect.setSelected(Widget.getCurrentThemeID());

		var settingsTabs = eowTabs({}, []);
		plugin.getBody().appendChild(settingsTabs);

		var pluginsTab = settingsTabs.addTab("Plugins");
			pluginsTab.article.appendChild(
				eowEl("div", { className: "pad" }).appendChildren([
					eowEl("ul", { id: "repolist" }),
					eowButton({ innerHTML: "Load Repositories", className: "fullwidth" }).on("click", () => loadRepositoryList(updateList))
				])
			);

		var tokenTab = settingsTabs.addTab("Tokens");
			tokenTab.article.appendChild(
				eowEl("div", { className: "pad" }).appendChildren([
					eowTextfield({ placeholder: "Github Access Token", value: (Widget.loadData("accesstoken") || "") }).on("input", function () { Widget.storeData("accesstoken", this.value); }),
				])
			);

		var themeTab = settingsTabs.addTab("Theme");
			themeTab.article.appendChild(
				eowEl("div", { className: "pad" }).appendChildren([
					themeSelect,
					eowEl("div", { className: "spacer" }),
					themeOpacity
				])
			);

		settingsTabs.selectTab("Plugins");

		plugin.getWidget().getWindow().on("close", () => remote.app.quit());

		updateCore();
		loadRepositoryList(updateList);

		Object.keys(Widget.loadData("widgets") || {}).filter(widgetID => widgetID != plugin.getWidget().getWidgetData("id")).map(widgetID => openWidget(widgetID));

		function updateList (list) {
			eowEl($("#repolist"))
				.clear()
				.appendChildren(list.map(item => 
					eowEl("li")
						.appendChildren([
							eowEl("h3", { innerHTML: item.name }),
							eowEl("p", { innerHTML: item.description }),
							eowButton({ innerHTML: `Open ${item.name}` }).on("click", () => {
								openWidget(
									Widget.saveWidget(
										Widget.createWidget({ plugins: [item.repository.url.replace("https://github.com/", "").replace(".git", "")] })
									).id
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
