var aim = aim || {};

aim.songManager = null;
aim.songListManager = null;
aim.bassPlayer = null;

function htmlToElement(html) {
	let template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

aim.Song = class {
	constructor(id, title, composer, author) {
		this.id = id;
		this.title = title;
		this.composer = composer;
		this.author = author;
	}
}

aim.ListPageController = class {
	constructor() {
		this.orderDirection = "asc";
		this.orderBy = "title";
		this.showingAllSongs = true;

		document.getElementById("buttonCreateSong").onclick = (event) => {
			aim.songListManager.createNewSong(
				document.getElementById("inputTitle").value,
				document.getElementById("inputComposer").value,
				document.getElementById("inputLength").value,
				document.getElementById("inputTempo").value);
		};

		document.getElementById("buttonSignOut").onclick = (event) => {
			aim.authManager.signOut();
		};

		document.querySelectorAll(".buttonSortBy").forEach((button) => {
			button.onclick = (event) => {
				if (button.dataset.state === "active") {
					if (this.orderDirection === "desc") {
						button.children[1].textContent = "arrow_drop_down";
						this.orderDirection = "asc";
					} else {
						button.children[1].textContent = "arrow_drop_up";
						this.orderDirection = "desc";
					}
				} else {
					let oldButton = document.querySelector("[data-state='active']");
					oldButton.children[1].classList.replace("d-block", "d-none");
					button.children[1].classList.replace("d-none", "d-block");
					oldButton.dataset.state = "inactive";
					button.dataset.state = "active"
					button.children[1].textContent = "arrow_drop_down";
					this.orderDirection = "asc";
					this.orderBy = button.dataset.orderBy;
				}
				this.updateList();
			};
		});

		document.getElementById("input-search-list").oninput = (event) => {
			this.updateList();
		}

		document.getElementById("buttonShowAllSongs").onclick = (event) => {
			this.showingAllSongs = true;
			this.updateList();
		};

		document.getElementById("buttonShowMySongs").onclick = (event) => {
			this.showingAllSongs = false;
			this.updateList();
		};

		$("#modalNewSong").on("show.bs.modal", (event) => {
			document.querySelectorAll(".inputNewSong").forEach((input) => {
				input.value = "";
			})
		});

		$("#modalNewSong").on("shown.bs.modal", (event) => {
			document.getElementById("inputTitle").focus();
		});

		aim.songListManager.beginListening(this.updateList.bind(this));
	}

	orderSongList(list) {
		let orderedList = list.sort((a, b) => {
			if (a[this.orderBy] === b[this.orderBy]) {
				return 0;
			} else {
				return a[this.orderBy] < b[this.orderBy] ? -1 : 1;
			}
		});
		return this.orderDirection === "desc" ? orderedList.reverse() : orderedList;
	}

	filterSongList(list, fields, filterValue) {
		if (!filterValue) {
			return list;
		}
		return list.filter((song) => {
			let result = false;
			fields.forEach((field) => {
				result = result || song[field].toUpperCase().includes(filterValue.toUpperCase());
			});
			return result;
		});
	}

	getCurrentSongList() {
		let list = [];
		for (let i = 0; i < aim.songListManager.length; ++i) {
			list.push(aim.songListManager.getSongAtIndex(i));
		}
		return list;
	}

	createListItem(song, index) {
		const listItem = htmlToElement(`
			<div id="${song.id}" class="list-group-item list-group-item-action justify-content-between ${index % 2 === 0 ? 'list-group-item-dark' : 'list-group-item-light'}">
				<span> ${song.title} </span>
				<span> ${song.composer} </span>
			</div>
		`);

		listItem.onclick = (event) => {
			window.location.href = `/song.html?id=${song.id}`;
		}
		return listItem;
	}

	updateList() {
		while ( document.getElementById("song-list").firstChild) {
			document.getElementById("song-list").removeChild(document.getElementById("song-list").lastChild);
		}

		let unorderedSongList = this.getCurrentSongList();
		let orderedSongList = this.orderSongList(unorderedSongList);
		let filteredSongList = this.filterSongList(orderedSongList, ["title", "composer"], document.getElementById("input-search-list").value);
		if (!this.showingAllSongs) {
			filteredSongList = this.filterSongList(filteredSongList, ["author"], aim.authManager.uid)
		}

		filteredSongList.forEach((song, index) => {
			document.getElementById("song-list").appendChild(this.createListItem(song, index));
		});
	}
}

aim.SongListManager = class {
	constructor(uid) {
		this._uid = uid;
		this._ref = firebase.firestore().collection("Songs");
		this._documentSnapshots = [];
		this._unsubscribe = null;
	}

	createNewSong(title, composer, length, tempo) {
		let chords = {};
		for (let i = 0; i < length; ++i) {
			chords[`measure ${i}`] = ["", "", "", ""]; // TODO: time sig
		}

		this._ref.doc(title).set({
			["author"]: aim.authManager.uid,
			["title"]: title,
			["composer"]: composer,
			["length"]: length,
			["tempo"]: tempo,
			["chords"]: chords,
			["lastTouched"]: firebase.firestore.Timestamp.now(),
		}).then((docRef) => {
			window.location.href = `/song.html?id=${title}`;
		}).catch((error) => {
			console.log(error);
		});
	}

	beginListening(onChangeFunction) {
		let query = this._ref.orderBy("title", "asc").limit(50);;
		if (this._uid) {
			query = query.where("author", "==", this._uid);
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			onChangeFunction();
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	get length() {
		return this._documentSnapshots.length;
	}

	getSongAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		return new aim.Song(docSnapshot.id, docSnapshot.get("title"), docSnapshot.get("composer"), docSnapshot.get("author"));
	}
}


aim.SongPageController = class {
	constructor() {
		this.selectedBeat = null;
		aim.bassPlayer = new musician.BassPlayer();

		document.getElementById("buttonEditMode").onclick = (event) => {
			if (aim.authManager.uid === aim.songManager.author) {
				console.log("Switching to edit mode");
				document.getElementById("buttonPerformanceMode").style.display = "block";
				document.getElementById("buttonEditMode").style.display = "none";
				document.querySelector(".dropdown-menu").style.left = "-180px";
				document.getElementById("song-title").contentEditable = "true";
				document.getElementById("song-composer").contentEditable = "true";
				document.querySelectorAll(".beat").forEach((beat) => {
					beat.contentEditable = "true";
				});
			}
		};

		document.getElementById("buttonPerformanceMode").onclick = (event) => {
			if (aim.authManager.uid === aim.songManager.author) {
				console.log("Switching to performance mode");
				document.getElementById("buttonPerformanceMode").style.display = "none";
				document.getElementById("buttonEditMode").style.display = "block";
				document.querySelector(".dropdown-menu").style.left = "-128px";
				document.getElementById("song-title").contentEditable = "false";
				document.getElementById("song-composer").contentEditable = "false";
				document.querySelectorAll(".beat").forEach((beat) => {
					beat.contentEditable = "false";
				});
			}
		};

		document.getElementById("song-title").oninput = (event) => {
			aim.songManager.updateField("title", document.getElementById("song-title").textContent);
		};

		document.getElementById("song-composer").oninput = (event) => {
			aim.songManager.updateField("composer", document.getElementById("song-composer").textContent);
		};

		document.getElementById("buttonPlaySong").onclick = (event) => {
			aim.bassPlayer.playSong(aim.songManager.songToTheoryChords(), document.getElementById("inputBPM").value);
		};

		document.getElementById("buttonStopSong").onclick = (event) => {
			aim.bassPlayer.stopSong();
		};

		document.getElementById("inputBPM").oninput = (event) => {
			// TODO: link to bpm
		};



		aim.songManager.beginListening(this.updateView.bind(this));

		const viewSetupInterval = setInterval(() => {
			try {
				if (aim.songManager._documentSnapshot) {
					document.getElementById("inputBPM").value = aim.songManager.tempo;
					if (aim.authManager.uid === aim.songManager.author) {
						document.getElementById("buttonEditMode").style.display = "block";
					}
					console.log("Setting up page now");
					clearInterval(viewSetupInterval);
				}
			} catch(error) { }
		}, 100);
	}

	updateView() {
		this._createMeasures();
		this._populateMeasures();
		this._populateMetadata();
	}

	_populateMetadata() {
		document.getElementById("song-title").textContent = aim.songManager.title;
		document.getElementById("song-composer").textContent = aim.songManager.composer;
	}

	_populateMeasures() {
		const measures = document.querySelectorAll(".measure");
		for (let i = 0; i < aim.songManager.length; ++i) {
			const measure = measures.item(i);
			const beats = measure.children;

			for (let j = 0; j < beats.length; ++j) {
				beats.item(j).textContent = aim.songManager.getChord(i, j);
			}
		}
	}

	_createMeasures() {
		if (document.getElementById("song-container").children.length === 0) {
			let stave = null;
			for (let i = 0; i < aim.songManager.length; ++i) {
				if (i % 4 === 0) {
					if (stave) {
						stave.appendChild(this._newBarLine());
					}
					stave = this._newStave();
					document.getElementById("song-container").appendChild(stave);
				}
				stave.appendChild(this._newBarLine());
				stave.appendChild(this._newMeasure(i));
			}
			stave.appendChild(this._newBarLine());
		}
	}

	_newStave() {
		const stave = document.createElement("div");
		stave.classList.add("stave");
		return stave;
	}

	_newBarLine() {
		const barLine = document.createElement("span");
		barLine.classList.add("bar-line");
		return barLine;
	}

	_newBeat(value) {
		const beat = document.createElement("div");
		beat.classList.add("beat");
		beat.dataset.value = value + "";
		beat.contentEditable = "false";
		beat.oninput = (event) => {
			beat.textContent = this._replaceSymbols(beat.textContent);
			aim.songManager.updateChord(beat.parentElement.dataset.value, beat.dataset.value, beat.textContent);
		}
		return beat;
	}

	_replaceSymbols(str) {
		return str.replace("^", "Δ").replace("b", "♭")
			.replace("nat", "♮").replace("#", "♯")
			.replace("o", "ο").replace("O", "ο")
			.replace("@", "∅");
		// .replace("1", "¹",)
		// 	.replace("2", "²",).replace("3", "³",)
		// 	.replace("4", "⁴").replace("5", "⁵").
		// 	replace("6", "⁶").replace("7", "⁷").
		// 	replace("8", "⁸").replace("9", "⁹");
	}

	_newMeasure(value) {
		const measure = document.createElement("div");
		measure.classList.add("measure");
		measure.dataset.value = value + "";
		for (let i = 0; i < 4; ++i) { // TODO: time signature
			measure.appendChild(this._newBeat(i));
		}
		return measure;
	}
}

aim.SongManager = class {
	constructor(songId) {
		this._ref = firebase.firestore().collection("Songs").doc(songId);
		this._documentSnapshot = [];
		this._unsubscribe = null;
	}

	beginListening(onChangeFunction) {
		this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				this._documentSnapshot = doc;
				onChangeFunction();
			} else {
				console.log("No such document!");
			}
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	updateChord(measure, beat, chord) {
		let newMeasure = this.getMeasure(measure);
		newMeasure[beat] = chord;
		this._ref.update({ [`chords.measure ${measure}`]: newMeasure}).then(() => {
			console.log("Document updated successfully!");
		}).catch((error) => {
			console.log(error);
		});
	}

	updateField(field, value) {
		this._ref.update({ [field]: value}).then(() => {
			console.log("Document updated successfully!");
		}).catch((error) => {
			console.log(error);
		});
	}

	get title() {
		return this._documentSnapshot.get("title");
	}

	get composer() {
		return this._documentSnapshot.get("composer");
	}

	get length() {
		return this._documentSnapshot.get("length");
	}

	get author() {
		return this._documentSnapshot.get("author");
	}

	get tempo() {
		return this._documentSnapshot.get("tempo");
	}

	getChord(measure, beat) {
		const docSnapshot = this._documentSnapshot;
		const chords = docSnapshot.get(`chords`);
		const fullMeasure = chords[`measure ${measure}`];
		return fullMeasure[beat];
	}

	getMeasure(measure) {
		const docSnapshot = this._documentSnapshot;
		const chords = docSnapshot.get(`chords`);
		return chords[`measure ${measure}`];
	}

	getChords() {
		const docSnapshot = this._documentSnapshot;
		const chords = docSnapshot.get(`chords`);
		return chords;
	}

	songToTheoryChords() {
		let chords = [];
		let currentChordLength = 0;
		let currentChord = null;

		for (let measure = 0; measure < this.length; ++measure) {
			for (let beat = 0; beat < 4; ++beat) {
				let chord = this.getChord(measure, beat);

				if (chord) {
					if (currentChord) {
						chords.push(new theory.Chord(currentChord, currentChordLength));
					}
					currentChord = chord;
					currentChordLength = 1;
				} else {
					++currentChordLength;
				}
			}
		}
		if (currentChordLength > 1) {
			chords.push(new theory.Chord(currentChord, currentChordLength));
		}

		return chords;
	}
}

aim.AuthManager = class {
	constructor() {
		this._user = null;
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}

	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log(error);
		});
	}

	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid
	}
}

aim.startFirebaseUI = function() {
	const ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start('#firebaseui-auth-container', {
		signInSuccessUrl: '/',
		signInOptions: [
			firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			firebase.auth.EmailAuthProvider.PROVIDER_ID,
			firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		]
	});
}

aim.checkForRedirects = function() {
	if (document.getElementById("loginPage") && aim.authManager.isSignedIn) {
		window.location.href = "/list.html";
	}
	if (!document.getElementById("loginPage") && !aim.authManager.isSignedIn) {
		window.location.href = "/";
	}
}

aim.initializePage = function() {
	const urlParams = new URLSearchParams(window.location.search);
	if(document.getElementById("listPage")) {
		aim.songListManager = new aim.SongListManager();
		new aim.ListPageController();
	} else if(document.getElementById("songPage")) {
		const songId = urlParams.get("id");
		if (!songId) {
			window.location.href = "/";
		}
		aim.songManager = new aim.SongManager(songId);
		new aim.SongPageController();
	} else if (document.getElementById("loginPage")) {
		aim.startFirebaseUI();
	}
}

aim.main = function () {
	console.log("Ready");
	aim.authManager = new aim.AuthManager();
	aim.authManager.beginListening(() => {
		aim.checkForRedirects();
		aim.initializePage();
	});
};

aim.main();


