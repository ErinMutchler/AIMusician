var theory = theory || {};
var musician = musician || {};

theory.Interval = class {
  static INTERVAL_DEFINITIONS = { ["P1"]: [0, 0],
    ["m2"]: [1, 1], ["A1"]: [1, 0],
    ["M2"]: [2, 1], ["d3"]: [2, 2],
    ["m3"]: [3, 2], ["A2"]: [3, 1],
    ["M3"]: [4, 2], ["d4"]: [4, 3],
    ["P4"]: [5, 3], ["A3"]: [5, 2],
    ["d5"]: [6, 4], ["A4"]: [6, 3],
    ["P5"]: [7, 4], ["d6"]: [7, 5],
    ["m6"]: [8, 5], ["A5"]: [8, 4],
    ["M6"]: [9, 5], ["d7"]: [9, 6],
    ["m7"]: [10, 6], ["A6"]: [10, 5],
    ["M7"]: [11, 6], ["d8"]: [11, 7],
    ["P8"]: [12, 7], ["A7"]: [12, 6],
  };

  constructor(string) {
    if (string in theory.Interval.INTERVAL_DEFINITIONS) {
      this.semitones = theory.Interval.INTERVAL_DEFINITIONS[string][0];
      this.letterSteps = theory.Interval.INTERVAL_DEFINITIONS[string][1];
    } else {
      throw "Interval is not valid";
    }
  }
}

theory.Accidental = class {
  static ACCIDENTAL_SYMBOLS = { ["♭♭"]: -2, ["♭"]: -1, ["♮"]: 0, [""]: 0, ["♯"]: 1, ["♯♯"]: 2 }
  static ORDERED_ACCIDENTALS = ["♭♭", "♭", "", "♯", "♯♯"];

  constructor(symbol) {
    if (!theory.Accidental.isValid(symbol)) {
      throw "Accidental is not valid";
    }
    this.symbol = symbol;
  }

  get symbol() {
    return this._symbol;
  }

  get value() {
    return this._value;
  }

  set symbol(symbol) {
    this._symbol = symbol;
    this._value = theory.Accidental.ACCIDENTAL_SYMBOLS[symbol];
  }

  set value(value) {
    this._value = value;
    this._symbol = theory.Accidental.ORDERED_ACCIDENTALS[value + 2];
  }

  static isValid(symbol) {
    return theory.Accidental.ORDERED_ACCIDENTALS.includes(symbol);
  }

  static valueToSymbol(value) {
    return new theory.Accidental(theory.Accidental.ORDERED_ACCIDENTALS[value + 2]);
  }
}

theory.NoteLetter = class {
  constructor(letter) {
    if (!theory.NoteLetter.isValid(letter)) {
      throw "Note Letter is not Valid";
    }
    this._symbol = letter;
    this._ordinal = theory.NoteLetter.letterToOrdinal(this.symbol);
    this._value = theory.NoteLetter.ordinalToValue(this.ordinal);
  }

  addOrdinal(ordinal) {
    return new theory.NoteLetter(theory.NoteLetter.ordinalToLetter((this.ordinal + ordinal + 7) % 7));
  }

  subOrdinal(ordinal) {
    return this.addOrdinal(-ordinal);
  }

  get symbol() {
    return this._symbol;
  }

  get ordinal() {
    return this._ordinal;
  }

  get value() {
    return this._value;
  }

  static isValid(letter) {
    return ["C", "D", "E", "F", "G", "A", "B"].includes(letter);
  }

  static letterToOrdinal(letter) {
    return (letter.charCodeAt(0) - "C".charCodeAt(0) + 7) % 7;
  }

  static ordinalToValue(ordinal) {
    return Math.floor((ordinal * 1.79) + 0.5);
  }

  static ordinalToLetter(ordinal) {
    return String.fromCharCode(((ordinal + 2) % 7) + "A".charCodeAt(0));
  }
}

theory.Note = class {
  constructor(str) {
    this.letter = new theory.NoteLetter(str[0]);
    this.accidental = new theory.Accidental(str.slice(1));
    this._simplify();
  }

  addInterval(interval) {
    const letter = this.letter.addOrdinal(interval.letterSteps);
    const accidental = theory.Accidental.valueToSymbol(interval.semitones - ((letter.value - this.value + 12) % 12));
    return new theory.Note(letter.symbol + accidental.symbol);
  }

  subtractInterval(interval) {
    const letter = this.letter.subOrdinal(interval.letterSteps);
    const accidental = theory.Accidental.valueToSymbol(-(interval.semitones - ((this.value - letter.value + 12) % 12)));
    return new theory.Note(letter.symbol + accidental.symbol);
  }

  get letter() {
    return this._letter;
  }

  get accidental() {
    return this._accidental;
  }

  get value() {
    return this._value;
  }

  get symbol() {
    return this._symbol;
  }

  set letter(noteLetter) {
    this._letter = noteLetter;
    this.accidental = this.accidental ? this.accidental : new theory.Accidental("");
    this._updateValue();
    this._updateSymbol();
  }

  set accidental(accidental) {
    this._accidental = accidental;
    this._updateValue();
    this._updateSymbol();
  }

  _updateValue() {
    this._value = (this.letter.value + this.accidental.value) % 12;
  }

  _updateSymbol() {
    this._symbol = this.letter.symbol + this.accidental.symbol;
  }

  _simplify() {
    if (this.accidental.value === -2) {
      this.letter = new theory.NoteLetter(theory.NoteLetter.ordinalToLetter(this.letter.value - 1));
      this.accidental = new theory.Accidental("");
    } else if (this.accidental.value === 2) {
      this.letter = new theory.NoteLetter(theory.NoteLetter.ordinalToLetter(this.letter.value + 1));
      this.accidental = new theory.Accidental("");
    }

    if (this.letter.letter === "C" && this.accidental.value === -1) {
      this.letter = new theory.NoteLetter("B");
      this.accidental = new theory.Accidental("");
    } else if (this.letter.letter === "F" && this.accidental.value === -1) {
      this.letter = new theory.NoteLetter("B");
      this.accidental = new theory.Accidental("");
    } else if (this.letter.letter === "B" && this.accidental.value === 1) {
      this.letter = new theory.NoteLetter("C");
      this.accidental = new theory.Accidental("");
    } else if (this.letter.letter === "E" && this.accidental.value === 1) {
      this.letter = new theory.NoteLetter("B");
      this.accidental = new theory.Accidental("");
    }
  }
}

theory.ChordQuality = class {
  constructor(str) {
    if (theory.ChordQuality.isValid(str.substring(0, 2))) {
      this._symbol = str.substring(0, 2);
    } else if (theory.ChordQuality.isValid(str.substring(0, 1))) {
      this._symbol = str.substring(0, 1);
    } else {
      throw "Chord Quality is not valid";
    }
  }

  get symbol() {
    return this._symbol;
  }

  static isValid(str) {
    return ["Δ", "-", "+", "ο", "∅", "7", "9", "13", "-Δ", "-+", "οΔ"].includes(str);
  }
}

theory.Extension = class {
  constructor(str) {
    if (theory.Extension.isValid(str.substring(0, 2))) {
      this._symbol = str.substring(0, 2);
    } else if (theory.Extension.isValid(str.substring(0, 1))) {
      this._symbol = str.substring(0, 1);
    } else {
      throw "Extension is not valid";
    }
  }

  get symbol() {
    return this._symbol;
  }

  static isValid(str) {
    return ["2", "♭2", "♮2", "♯2", "3", "♭3", "♮3", "♯3", "4", "♭4", "♮4", "♯4",
      "5", "♭5", "♮5", "♯5", "6", "♭6", "♮6", "♯6", "7", "♭7", "♮7", "♯7",
      "9", "♭9", "♮9", "♯9", "11", "♭11", "♮11", "♯11", "13", "♭13", "♮13", "♯13"].includes(str)
  }
}

theory.Chord = class {
  constructor(str, length) {
    try {
      this._root = new theory.Note(str[0] + (theory.Accidental.isValid(str[1]) ? str[1] : ""));
      str = str.substring(this._root.symbol.length);

      this._quality = new theory.ChordQuality(str);
      str = str.substring(this._quality.symbol.length);

      this._extensions = [];
      while (str.length > 0) {
        this._extensions.push(new theory.Extension(str));
        str = str.substring(this._extensions[this._extensions.length - 1].symbol.length);
      }

      this._mode = theory.MODE_SYMBOLS[this._quality.symbol + this.extensionSymbols];
      this._length = length;
    } catch(error) {
      console.log(error);
    }
  }

  getNoteAtScaleDegree(scaleDegree) {
    return this.root.addInterval(theory.MODE_DICTIONARY[this.mode][(scaleDegree - 1) % 7]);
  }

  isChordTone(note) {
    for (let i = 0; i < theory.MODE_DICTIONARY[this.mode].length; ++i) {
      if (this.root.addInterval(theory.MODE_DICTIONARY[this.mode][i]).value === note.value) {
        return true
      }
    }
    return false;
  }

  getScaleDegreeOfNote(note) {
    for (let i = 0; i < theory.MODE_DICTIONARY[this.mode].length; ++i) {
      if (this.root.addInterval(theory.MODE_DICTIONARY[this.mode][i]).value === note.value) {
        return i + 1;
      }
    }
    throw "Note is not part of chord";
  }

  get root() {
    return this._root;
  }

  get length() {
    return this._length;
  }

  get mode() {
    return this._mode;
  }

  get extensionSymbols() {
    let symbols = "";
    this._extensions.forEach((extension) => {
      symbols = symbols + extension.symbol;
    });
    return symbols;
  }

  get symbol() {
    return this._root.symbol + this._quality.symbol + this.extensionSymbols;
  }
}

musician.AUDIO_CONTEXT = new AudioContext();

musician.BassPlayer = class {
  constructor() {
    this.isPlaying = false;
    this.songTimers = [];

    this.DRUM_LOOP = this.createSample("../drum-samples/swing_loop_182bpm.wav");
    this.DRUM_LOOP.volume = 0.5;

    // this.DRUM_LOOPS = {
    //   ["1"]: this.createSample("../drum-samples/swing_loop_182bpm.mp3"),
    //   ["2"]: this.createSample("../drum-samples/swing_loop_182bpm.mp3"),
    //   ["3"]: this.createSample("../drum-samples/swing_loop_182bpm.mp3"),
    // }

    this.BASS_SAMPLES = {
      ["E1"]: this.createSample("E1.mp3"),
      ["F1"]: this.createSample("F1.mp3"),
      ["F#1"]: this.createSample("Fs1.mp3"),
      ["G1"]: this.createSample("G1.mp3"),
      ["G#1"]: this.createSample("Gs1.mp3"),
      ["A1"]: this.createSample("A1.mp3"),
      ["A#1"]: this.createSample("As1.mp3"),
      ["B1"]: this.createSample("B1.mp3"),
      ["C2"]: this.createSample("C2.mp3"),
      ["C#2"]: this.createSample("Cs2.mp3"),
      ["D2"]: this.createSample("D2.mp3"),
      ["D#2"]: this.createSample("Ds2.mp3"),
      ["E2"]: this.createSample("E2.mp3"),
      ["F2"]: this.createSample("F2.mp3"),
      ["F#2"]: this.createSample("Fs2.mp3"),
      ["G2"]: this.createSample("G2.mp3"),
      ["G#2"]: this.createSample("Gs2.mp3"),
      ["A2"]: this.createSample("A2.mp3"),
      ["A#2"]: this.createSample("As2.mp3"),
      ["B2"]: this.createSample("B2.mp3"),
      ["C3"]: this.createSample("C3.mp3"),
      ["C#3"]: this.createSample("Cs3.mp3"),
      ["D3"]: this.createSample("D3.mp3"),
      ["D#3"]: this.createSample("Ds3.mp3"),
      ["E3"]: this.createSample("E3.mp3"),
      ["F3"]: this.createSample("F3.mp3"),
      ["F#3"]: this.createSample("Fs3.mp3"),
      ["G3"]: this.createSample("G3.mp3"),
      ["G#3"]: this.createSample("Gs3.mp3"),
      ["A3"]: this.createSample("A3.mp3"),
      ["A#3"]: this.createSample("As3.mp3"),
      ["B3"]: this.createSample("B3.mp3"),
      ["C4"]: this.createSample("C4.mp3"),
    };
  }

  playSong(chords, bpm) {
    if (musician.AUDIO_CONTEXT.state === 'suspended') {
      musician.AUDIO_CONTEXT.resume();
    }

    if (this.isPlaying) {
      return;
    }

    try {
      this.isPlaying = true;
      let line = [];
      chords.forEach((chord, index) => {
        const nextChord = chords[(index + 1) % chords.length];
        let chordLine = [];
        chordLine[0] = chord.root;
        switch (chord.length) {
          case 1:
            break;
          case 2:
            chordLine[1] = this.LT(nextChord);
            break;
          case 3:
            chordLine[2] = this.LT(nextChord);
            chordLine[1] = this.NCT(chord, chordLine[2]);
            break;
          case 4:
            chordLine[3] = this.LT(nextChord);
            chordLine[2] = this.NCT(chord, chordLine[3]);
            chordLine[1] = this.HB(chord, chordLine[0], chordLine[2]);
            break;
          case 5:
            chordLine[4] = this.LT(nextChord);
            chordLine[2] = this.NCT(chord, chordLine[4]);
            chordLine[1] = this.HB(chord, chordLine[0], chordLine[2]);
            chordLine[3] = this.HB(chord, chordLine[2], chordLine[4]);
            break;
          case 6:
            chordLine[5] = this.LT(nextChord);
            chordLine[4] = this.NCT(chord, chordLine[5]);
            chordLine[2] = this.NCT(chord, chordLine[4]);
            chordLine[1] = this.HB(chord, chordLine[0], chordLine[2]);
            chordLine[3] = this.HB(chord, chordLine[2], chordLine[4]);
            break;
          case 7:
            chordLine[6] = this.LT(nextChord);
            chordLine[4] = this.NCT(chord, chordLine[6]);
            chordLine[2] = this.NCT(chord, chordLine[4]);
            chordLine[1] = this.HB(chord, chordLine[0], chordLine[2]);
            chordLine[3] = this.HB(chord, chordLine[2], chordLine[4]);
            chordLine[5] = this.HB(chord, chordLine[4], chordLine[6]);
            break;
          case 8:
            chordLine[7] = this.LT(nextChord);
            chordLine[6] = this.NCT(chord, chordLine[7]);
            chordLine[4] = this.NCT(chord, chordLine[6]);
            chordLine[2] = this.NCT(chord, chordLine[4]);
            chordLine[1] = this.HB(chord, chordLine[0], chordLine[2]);
            chordLine[3] = this.HB(chord, chordLine[2], chordLine[4]);
            chordLine[5] = this.HB(chord, chordLine[4], chordLine[6]);
            break;
        }

        chordLine.forEach((e) => {
          line.push(e);
        });
      });

      line.forEach((note, index) => {
        this.songTimers[index] = setTimeout(() => {
          if (index % 4 === 0) {
            this.DRUM_LOOP.playbackRate = bpm / 182;
            this.DRUM_LOOP.pause();
            this.DRUM_LOOP.currentTime = 0;
            this.DRUM_LOOP.play();
          }

          let str = note.symbol.replace("♭", "b").replace("♯", "#").replace("♮", "")
            .replace("Cb", "B").replace("Db", "C#").replace("Eb", "D#").replace("Fb", "E").replace("Gb","F#").replace("Ab", "G#").replace("Bb", "A#");
          this.BASS_SAMPLES[str + "2"].playbackRate = bpm / 60;
          this.BASS_SAMPLES[str + "2"].pause();
          this.BASS_SAMPLES[str + "2"].currentTime = 0;
          this.BASS_SAMPLES[str + "2"].play();
          if (index === line.length - 1) {
            this.stopSong();
          }
        }, (60 / bpm) * 1000 * index);
      });
    } catch (error) {
      this.stopSong()
      console.log(error);
    }
  }

  stopSong() {
    this.songTimers.forEach((songTimer) => {
      if (songTimer) {
        clearTimeout(songTimer);
      }
    });

    this.DRUM_LOOP.pause();
    this.DRUM_LOOP.currentTime = 0;
    for(let i =0; i < this.BASS_SAMPLES.length; ++i) {
      this.BASS_SAMPLES[i].pause();
      this.BASS_SAMPLES[i].currentTime = 0;
    }
    this.isPlaying = false;
  }

  LT(chord) {
    let leadingTones = [];
    leadingTones.push(chord.root.addInterval(theory.INTERVALS.m2));
    leadingTones.push(chord.root.subtractInterval(theory.INTERVALS.m2));
    leadingTones.push(chord.getNoteAtScaleDegree(2));

    // leadingTones.push(chord.getNoteAtScaleDegree(5));
    leadingTones.push(chord.getNoteAtScaleDegree(7));
    return leadingTones[Math.floor(Math.random() * leadingTones.length)];
  }

  NCT(chord, note) {
    const chordTones = [chord.getNoteAtScaleDegree(1),
      chord.getNoteAtScaleDegree(3), chord.getNoteAtScaleDegree(5), chord.getNoteAtScaleDegree(6), chord.getNoteAtScaleDegree(7)];
    let nct = chordTones[0];
    chordTones.forEach((chordTone) => {
      if (Math.abs(note.value - chordTone.value) < Math.abs(note.value - nct.value)) {
        nct = chordTone;
      }
    });

    return nct;
  }

  HB(chord, a, b) {
    let aDegree = chord.isChordTone(a) ? chord.getScaleDegreeOfNote(a) : chord.getScaleDegreeOfNote(this.NCT(chord, a));
    let bDegree = chord.isChordTone(b) ? chord.getScaleDegreeOfNote(b) : chord.getScaleDegreeOfNote(this.NCT(chord, b));
    return chord.getNoteAtScaleDegree(((Math.floor((aDegree + bDegree) / 2)) % 7) + 1);
  }

  createSample(filename) {
    const audioElement = document.createElement('audio');
    audioElement.src = "../assets/bass-samples/" + filename;
    const mediaElement = musician.AUDIO_CONTEXT.createMediaElementSource(audioElement);
    mediaElement.connect(musician.AUDIO_CONTEXT.destination);
    return audioElement;
  }
}

theory.MODE_SYMBOLS = {
  ["Δ"]: "IONIAN", ["Δ6"]: "IONIAN", ["Δ7"]: "IONIAN", ["Δ9"]: "IONIAN", ["Δ11"]: "IONIAN", ["Δ13"]: "IONIAN",
  ["-"]: "DORIAN",  ["-6"]: "DORIAN",  ["-7"]: "DORIAN",  ["-9"]: "DORIAN",  ["-11"]: "DORIAN", ["-13"]: "DORIAN",
  ["-♭2♭6"]: "PHRYGIAN", ["-7♭2♭6"]: "PHRYGIAN", ["-11♭2♭6"]: "PHRYGIAN", ["-♭2♭13"]: "PHRYGIAN",  ["-7♭2♭13"]: "PHRYGIAN", ["-11♭2♭13"]: "PHRYGIAN",  ["-♭6♭9"]: "PHRYGIAN",  ["-7♭6♭9"]: "PHRYGIAN",  ["-11♭6♭9"]: "PHRYGIAN",
  ["Δ♯11"]: "LYDIAN", ["Δ6♯11"]: "LYDIAN", ["Δ7♯11"]: "LYDIAN", ["Δ9♯11"]: "LYDIAN", ["Δ13♯11"]: "LYDIAN", ["Δ♯4"]: "LYDIAN", ["Δ6♯4"]: "LYDIAN", ["Δ7♯4"]: "LYDIAN", ["Δ9♯4"]: "LYDIAN", ["Δ13♯4"]: "LYDIAN",
  ["7"]: "MIXOLYDIAN", ["9"]: "MIXOLYDIAN", ["13"]: "MIXOLYDIAN",
  ["-♭6"]: "AEOLIAN", ["-7♭6"]: "AEOLIAN", ["-9♭6"]: "AEOLIAN", ["-11♭6"]: "AEOLIAN", ["-♭13"]: "AEOLIAN", ["-7♭13"]: "AEOLIAN", ["-9♭13"]: "AEOLIAN", ["-11♭13"]: "AEOLIAN",
  ["TODO: LOCRIAN SYMBOL HERE"]: "LOCRIAN",

  ["-Δ♭6"]: "AEOLIAN ♮7", ["-Δ♭13"]: "AEOLIAN ♮7", ["-Δ7♭6"]: "AEOLIAN ♮7", ["-Δ7♭13"]: "AEOLIAN ♮7", ["-Δ9♭6"]: "AEOLIAN ♮7", ["-Δ9♭13"]: "AEOLIAN ♮7", ["-Δ11♭6"]: "AEOLIAN ♮7", ["-Δ11♭13"]: "AEOLIAN ♮7",
  ["TODO: LOCRIAN OTHER SYMBOL HERE"]: "LOCRIAN OTHER",
  ["Δ+"]: "IONIAN ♯5", ["Δ+6"]: "IONIAN ♯5", ["Δ+7"]: "IONIAN ♯5", ["Δ+9"]: "IONIAN ♯5", ["Δ+11"]: "IONIAN ♯5", ["Δ+13"]: "IONIAN ♯5",
  ["-♯4"]: "DORIAN ♯4", ["-♯11"]: "DORIAN ♯4", ["-6♯4"]: "DORIAN ♯4", ["-6♯11"]: "DORIAN ♯4", ["-7♯4"]: "DORIAN ♯4", ["-7♯11"]: "DORIAN ♯4", ["-9♯4"]: "DORIAN ♯4", ["-9♯11"]: "DORIAN ♯4", ["-13♯4"]: "DORIAN ♯4", ["-13♯11"]: "DORIAN ♯4",
  ["-♭2♭6♮3"]: "PHRYGIAN ♮3", ["-7♭2♭6♮3"]: "PHRYGIAN ♮3", ["-11♭2♭6♮3"]: "PHRYGIAN ♮3", ["-♭2♭13♮3"]: "PHRYGIAN ♮3", ["-7♭2♭13♮3"]: "PHRYGIAN ♮3", ["-11♭2♭13♮3"]: "PHRYGIAN ♮3", ["-♭6♭9♮3"]: "PHRYGIAN ♮3", ["-7♭6♭9♮3"]: "PHRYGIAN ♮3", ["-11♭6♭9♮3"]: "PHRYGIAN ♮3",
  ["Δ♯2♯11"]: "LYDIAN ♯2", ["Δ♯9♯11"]: "LYDIAN ♯2", ["Δ6♯2♯11"]: "LYDIAN ♯2", ["Δ6♯9♯11"]: "LYDIAN ♯2", ["Δ7♯2♯11"]: "LYDIAN ♯2", ["Δ7♯9♯11"]: "LYDIAN ♯2", ["Δ13♯2♯11"]: "LYDIAN ♯2", ["Δ13♯11"]: "LYDIAN ♯2", ["Δ♯2♯4"]: "LYDIAN ♯2", ["Δ♯4♯9"]: "LYDIAN ♯2", ["Δ6♯2♯4"]: "LYDIAN ♯2", ["Δ6♯4♯9"]: "LYDIAN ♯2", ["Δ7♯2♯4"]: "LYDIAN ♯2", ["Δ7♯4♯9"]: "LYDIAN ♯2", ["Δ13♯2♯4"]: "LYDIAN ♯2", ["Δ13♯9♯4"]: "LYDIAN ♯2",

  ["-Δ"]: "DORIAN ♮7", ["-Δ6"]: "DORIAN ♮7", ["-Δ7"]: "DORIAN ♮7", ["-Δ9"]: "DORIAN ♮7", ["-Δ11"]: "DORIAN ♮7", ["-Δ13"]: "DORIAN ♮7",
  ["-♭2"]: "PHRYGIAN ♮6", ["-♭9"]: "PHRYGIAN ♮6", ["-♭2♮6"]: "PHRYGIAN ♮6", ["-♭9♮6"]: "PHRYGIAN ♮6", ["-♭2♮13"]: "PHRYGIAN ♮6", ["-♭9♮13"]: "PHRYGIAN ♮6", ["-7♭2"]: "PHRYGIAN ♮6", ["-7♭9"]: "PHRYGIAN ♮6", ["-7♭2♮6"]: "PHRYGIAN ♮6", ["-7♭9♮6"]: "PHRYGIAN ♮6", ["-7♭2♮13"]: "PHRYGIAN ♮6", ["-7♭9♮13"]: "PHRYGIAN ♮6", ["-11♭2"]: "PHRYGIAN ♮6", ["-11♭9"]: "PHRYGIAN ♮6", ["-11♭2♮6"]: "PHRYGIAN ♮6", ["-11♭9♮6"]: "PHRYGIAN ♮6", ["-11♭2♮13"]: "PHRYGIAN ♮6", ["-11♭9♮13"]: "PHRYGIAN ♮6",
  ["Δ♯11♯5"]: "LYDIAN ♯5", ["Δ7♯11♯5"]: "LYDIAN ♯5", ["Δ9♯11♯5"]: "LYDIAN ♯5", ["Δ♯4♯5"]: "LYDIAN ♯5", ["Δ7♯4♯5"]: "LYDIAN ♯5", ["Δ+9♯4"]: "LYDIAN ♯5", ["Δ9♯4♯5"]: "LYDIAN ♯5", ["Δ+9♯11"]: "LYDIAN ♯5", ["Δ+♯11"]: "LYDIAN ♯5", ["Δ+7♯11"]: "LYDIAN ♯5", ["Δ+♯4"]: "LYDIAN ♯5", ["Δ+7♯4"]: "LYDIAN ♯5",
  ["7♯4"]: "MIXOLYDIAN ♯4", ["9♯4"]: "MIXOLYDIAN ♯4", ["13♯4"]: "MIXOLYDIAN ♯4", ["7♯11"]: "MIXOLYDIAN ♯4", ["9♯11"]: "MIXOLYDIAN ♯4", ["13♯11"]: "MIXOLYDIAN ♯4",
  ["7♭6"]: "MIXOLYDIAN ♭6", ["9♭6"]: "MIXOLYDIAN ♭6", ["7♭13"]: "MIXOLYDIAN ♭6", ["9♭13"]: "MIXOLYDIAN ♭6",

  ["∅"]: "LOCRIAN ♮2", ["∅7"]: "LOCRIAN ♮2", ["∅9"]: "LOCRIAN ♮2", ["-7♭5"]: "LOCRIAN ♮2", ["-9♭5"]: "LOCRIAN ♮2",
  ["Δ♭6"]: "IONIAN ♭6", ["Δ♭13"]: "IONIAN ♭6", ["Δ7♭6"]: "IONIAN ♭6", ["Δ7♭13"]: "IONIAN ♭6", ["Δ9♭6"]: "IONIAN ♭6", ["Δ9♭13"]: "IONIAN ♭6", ["Δ11♭6"]: "IONIAN ♭6", ["Δ11♭13"]: "IONIAN ♭6",
  ["-♭5"]: "DORIAN ♭5", ["-6♭5"]: "DORIAN ♭5", ["-7♭5"]: "DORIAN ♭5", ["-9♭5"]: "DORIAN ♭5", ["-13♭5"]: "DORIAN ♭5",
  ["-♭2♭4♭6"]: "PHRYGIAN ♭4", ["-♭2♭6♭11"]: "PHRYGIAN ♭4", ["-7♭2♭4♭6"]: "PHRYGIAN ♭4", ["-7♭2♭6♭11"]: "PHRYGIAN ♭4", ["-♭2♭4♭13"]: "PHRYGIAN ♭4", ["-♭2♭11♭13"]: "PHRYGIAN ♭4", ["-7♭2♭4♭13"]: "PHRYGIAN ♭4", ["-7♭2♭11♭13"]: "PHRYGIAN ♭4", ["-♭6♭4♭9"]: "PHRYGIAN ♭4", ["-♭6♭9♭11"]: "PHRYGIAN ♭4", ["-7♭6♭4♭9"]: "PHRYGIAN ♭4", ["-7♭6♭9♭11"]: "PHRYGIAN ♭4",
  ["-Δ♯4"]: "DORIAN ♮7♯4", ["-Δ♯11"]: "DORIAN ♮7♯4", ["-Δ6♯4"]: "DORIAN ♮7♯4", ["-Δ6♯11"]: "DORIAN ♮7♯4", ["-Δ7♯4"]: "DORIAN ♮7♯4", ["-Δ7♯11"]: "DORIAN ♮7♯4", ["-Δ9♯4"]: "DORIAN ♮7♯4", ["-Δ9♯11"]: "DORIAN ♮7♯4", ["-Δ13♯4"]: "DORIAN ♮7♯4", ["-Δ13♯11"]: "DORIAN ♮7♯4",
  ["7♭2"]: "MIXOLYDIAN ♭2", ["7♭9"]: "MIXOLYDIAN ♭2", ["13♭2"]: "MIXOLYDIAN ♭2", ["13♭9"]: "MIXOLYDIAN ♭2",
  ["Δ♯2♯11♯5"]: "LYDIAN ♯2♯5", ["Δ♯9♯11♯5"]: "LYDIAN ♯2♯5", ["Δ7♯2♯11♯5"]: "LYDIAN ♯2♯5", ["Δ7♯9♯11♯5"]: "LYDIAN ♯2♯5", ["Δ♯2♯4♯5"]: "LYDIAN ♯2♯5", ["Δ♯4♯5♯9"]: "LYDIAN ♯2♯5", ["Δ7♯2♯4♯5"]: "LYDIAN ♯2♯5", ["Δ7♯4♯5♯9"]: "LYDIAN ♯2♯5", ["Δ+♯2♯11"]: "LYDIAN ♯2♯5", ["Δ+♯9♯11"]: "LYDIAN ♯2♯5", ["Δ+7♯2♯11"]: "LYDIAN ♯2♯5", ["Δ+7♯9♯11"]: "LYDIAN ♯2♯5", ["Δ+♯2♯4"]: "LYDIAN ♯2♯5", ["Δ+♯4♯9"]: "LYDIAN ♯2♯5", ["Δ+7♯2♯4"]: "LYDIAN ♯2♯5", ["Δ+7♯4♯9"]: "LYDIAN ♯2♯5",
}

theory.INTERVALS = {
  ["P1"]: new theory.Interval("P1"),
  ["m2"]: new theory.Interval("m2"), ["A1"]: new theory.Interval("A1"),
  ["M2"]: new theory.Interval("M2"), ["d3"]: new theory.Interval("d3"),
  ["m3"]: new theory.Interval("m3"), ["A2"]: new theory.Interval("A2"),
  ["M3"]: new theory.Interval("M3"), ["d4"]: new theory.Interval("d4"),
  ["P4"]: new theory.Interval("P4"), ["A3"]: new theory.Interval("A3"),
  ["d5"]: new theory.Interval("d5"), ["A4"]: new theory.Interval("A4"),
  ["P5"]: new theory.Interval("P5"), ["d6"]: new theory.Interval("d6"),
  ["m6"]: new theory.Interval("m6"), ["A5"]: new theory.Interval("A5"),
  ["M6"]: new theory.Interval("M6"), ["d7"]: new theory.Interval("d7"),
  ["m7"]: new theory.Interval("m7"), ["A6"]: new theory.Interval("A6"),
  ["M7"]: new theory.Interval("M7"), ["d8"]: new theory.Interval("d8"),
  ["P8"]: new theory.Interval("P8"), ["A7"]: new theory.Interval("A7")
};

theory.MODE_DICTIONARY = {
  ["IONIAN"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.M3, theory.INTERVALS.P4, theory.INTERVALS.P5, theory.INTERVALS.M6, theory.INTERVALS.M7],
  ["DORIAN"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.m3, theory.INTERVALS.P4, theory.INTERVALS.P5, theory.INTERVALS.M6, theory.INTERVALS.m7],
  ["PHRYGIAN"]: [theory.INTERVALS.P1, theory.INTERVALS.m2, theory.INTERVALS.m3, theory.INTERVALS.P4, theory.INTERVALS.P5, theory.INTERVALS.m6, theory.INTERVALS.m7],
  ["LYDIAN"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.M3, theory.INTERVALS.A4, theory.INTERVALS.P5, theory.INTERVALS.M6, theory.INTERVALS.M7],
  ["MIXOLYDIAN"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.M3, theory.INTERVALS.P4, theory.INTERVALS.P5, theory.INTERVALS.M6, theory.INTERVALS.m7],
  ["AEOLIAN"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.m3, theory.INTERVALS.P4, theory.INTERVALS.P5, theory.INTERVALS.m6, theory.INTERVALS.m7],
  ["LOCRIAN"]: [theory.INTERVALS.P1, theory.INTERVALS.m2, theory.INTERVALS.m3, theory.INTERVALS.P4, theory.INTERVALS.d5, theory.INTERVALS.m6, theory.INTERVALS.m7],

  ["DORIAN ♮7"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.m3, theory.INTERVALS.P4, theory.INTERVALS.P5, theory.INTERVALS.M6, theory.INTERVALS.M7],
  ["PHRYGIAN ♮6"]: [theory.INTERVALS.P1, theory.INTERVALS.m2, theory.INTERVALS.m3, theory.INTERVALS.P4, theory.INTERVALS.P5, theory.INTERVALS.M6, theory.INTERVALS.m7],
  ["LYDIAN ♯5"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.M3, theory.INTERVALS.A4, theory.INTERVALS.A5, theory.INTERVALS.M6, theory.INTERVALS.M7],
  ["MIXOLYDIAN ♯4"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.M3, theory.INTERVALS.A4, theory.INTERVALS.P5, theory.INTERVALS.M6, theory.INTERVALS.m7],
  ["AEOLIAN ♮3"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.M3, theory.INTERVALS.P4, theory.INTERVALS.P5, theory.INTERVALS.m6, theory.INTERVALS.m7],
  ["LOCRIAN ♮2"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.m3, theory.INTERVALS.P4, theory.INTERVALS.d5, theory.INTERVALS.m6, theory.INTERVALS.m7],
  ["IONIAN ♯1"]: [theory.INTERVALS.P1, theory.INTERVALS.m2, theory.INTERVALS.m3, theory.INTERVALS.d4, theory.INTERVALS.d5, theory.INTERVALS.m6, theory.INTERVALS.m7],

  ["IONIAN ♭6"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.M3, theory.INTERVALS.P4, theory.INTERVALS.P5, theory.INTERVALS.m6, theory.INTERVALS.M7],
  ["DORIAN ♭5"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.m3, theory.INTERVALS.P4, theory.INTERVALS.d5, theory.INTERVALS.M6, theory.INTERVALS.m7],
  ["PHRYGIAN ♭4"]: [theory.INTERVALS.P1, theory.INTERVALS.m2, theory.INTERVALS.m3, theory.INTERVALS.d4, theory.INTERVALS.P5, theory.INTERVALS.m6, theory.INTERVALS.m7],
  ["LYDIAN ♭3"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.m3, theory.INTERVALS.A4, theory.INTERVALS.P5, theory.INTERVALS.M6, theory.INTERVALS.M7],
  ["MIXOLYDIAN ♭2"]: [theory.INTERVALS.P1, theory.INTERVALS.m2, theory.INTERVALS.M3, theory.INTERVALS.P4, theory.INTERVALS.P5, theory.INTERVALS.M6, theory.INTERVALS.m7],
  ["AEOLIAN ♭1"]: [theory.INTERVALS.P1, theory.INTERVALS.m3, theory.INTERVALS.M3, theory.INTERVALS.d4, theory.INTERVALS.A5, theory.INTERVALS.M6, theory.INTERVALS.M7],
  ["LOCRIAN ♭♭7"]: [theory.INTERVALS.P1, theory.INTERVALS.m2, theory.INTERVALS.m3, theory.INTERVALS.P4, theory.INTERVALS.d5, theory.INTERVALS.m6, theory.INTERVALS.m7],

  ["AEOLIAN ♮7"]: [theory.INTERVALS.P1, theory.INTERVALS.m2, theory.INTERVALS.m3, theory.INTERVALS.P4, theory.INTERVALS.P5, theory.INTERVALS.m6, theory.INTERVALS.M7],
  ["LOCRIAN ♮6"]: [theory.INTERVALS.P1, theory.INTERVALS.m2, theory.INTERVALS.m3, theory.INTERVALS.P4, theory.INTERVALS.d5, theory.INTERVALS.M6, theory.INTERVALS.m7],
  ["IONIAN ♯5"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.M3, theory.INTERVALS.P4, theory.INTERVALS.A5, theory.INTERVALS.M6, theory.INTERVALS.M7],
  ["DORIAN ♯4"]: [theory.INTERVALS.P1, theory.INTERVALS.M2, theory.INTERVALS.m3, theory.INTERVALS.A4, theory.INTERVALS.P5, theory.INTERVALS.M6, theory.INTERVALS.m7],
  ["PHRYGIAN ♮3"]: [theory.INTERVALS.P1, theory.INTERVALS.m2, theory.INTERVALS.M3, theory.INTERVALS.P4, theory.INTERVALS.P5, theory.INTERVALS.m6, theory.INTERVALS.m7],
  ["LYDIAN ♯2"]: [theory.INTERVALS.P1, theory.INTERVALS.A2, theory.INTERVALS.M3, theory.INTERVALS.A4, theory.INTERVALS.P5, theory.INTERVALS.M6, theory.INTERVALS.M7],
  ["MIXOLYDIAN ♯1"]: [theory.INTERVALS.P1, theory.INTERVALS.m2, theory.INTERVALS.m3, theory.INTERVALS.d4, theory.INTERVALS.A5, theory.INTERVALS.m6, theory.INTERVALS.d7],
}


