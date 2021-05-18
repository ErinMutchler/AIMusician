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
  }

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

musician.BassPlayer = class {
  constructor() {
  }

  playSong(chords) {
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

    const now = Tone.now()
    Tone.Transport.bpm.value = 110;
    const synth = new Tone.Synth().toDestination();

    const AMinorScale = ['F3', 'A3', 'C4', 'B3', 'Bb3', 'D4', 'Eb4', 'E4'];
    let time = Tone.now();

    Tone.Transport.start();

    line.forEach((note, index) => {
      let str = note.symbol.replace("♭", "b").replace("♯", "#").replace("♮", "");
      console.log(note.symbol);
      synth.triggerAttackRelease(str + "4", "4n", time);
      time = time + Tone.Time("4n");

    });

  }

  LT(chord) {
    let leadingTones = [];
    leadingTones.push(chord.root.addInterval(theory.INTERVALS.m2));
    leadingTones.push(chord.root.subtractInterval(theory.INTERVALS.m2));
    leadingTones.push(chord.getNoteAtScaleDegree(2));
    leadingTones.push(chord.getNoteAtScaleDegree(3));
    leadingTones.push(chord.getNoteAtScaleDegree(5));
    leadingTones.push(chord.getNoteAtScaleDegree(7));
    return leadingTones[Math.floor(Math.random() * leadingTones.length)];
  }

  NCT(chord, note) {
    const chordTones = [chord.getNoteAtScaleDegree(1), chord.getNoteAtScaleDegree(2),
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
    let aDegree = chord.getScaleDegreeOfNote(a);
    let bDegree = chord.getScaleDegreeOfNote(b);
    return chord.getNoteAtScaleDegree(((Math.floor((aDegree + bDegree) / 2)) % 7) + 1);
  }
}

// TODO: fix chords below and add rest of them
theory.MODE_SYMBOLS = {
  ["Δ"]: "IONIAN", ["Δ6"]: "IONIAN", ["Δ7"]: "IONIAN", ["Δ9"]: "IONIAN", ["Δ11"]: "IONIAN", ["Δ13"]: "IONIAN",
  ["-"]: "DORIAN",  ["-6"]: "DORIAN",  ["-7"]: "DORIAN",  ["-9"]: "DORIAN",  ["-11"]: "DORIAN", ["-13"]: "DORIAN",
  ["-♭2♭6"]: "PHRYGIAN", ["-7♭2♭6"]: "PHRYGIAN", ["-11♭2♭6"]: "PHRYGIAN", ["-♭2♭13"]: "PHRYGIAN",  ["-7♭2♭13"]: "PHRYGIAN", ["-11♭2♭13"]: "PHRYGIAN",  ["-♭6♭9"]: "PHRYGIAN",  ["-7♭6♭9"]: "PHRYGIAN",  ["-11♭6♭9"]: "PHRYGIAN",
  ["Δ♯11"]: "LYDIAN", ["Δ6♯11"]: "LYDIAN", ["Δ7♯11"]: "LYDIAN", ["Δ9♯11"]: "LYDIAN", ["Δ13♯11"]: "LYDIAN", ["Δ♯4"]: "LYDIAN", ["Δ6♯4"]: "LYDIAN", ["Δ7♯4"]: "LYDIAN", ["Δ9♯4"]: "LYDIAN", ["Δ13♯4"]: "LYDIAN",
  ["7"]: "MIXOLYDIAN", ["9"]: "MIXOLYDIAN", ["13"]: "MIXOLYDIAN",
  ["AEOLIAN"]: "-♭6", ["AEOLIAN"]: "-7♭6", ["AEOLIAN"]: "-9♭6", ["AEOLIAN"]: "-11♭6", ["AEOLIAN"]: "-♭13", ["AEOLIAN"]: "-7♭13", ["AEOLIAN"]: "-9♭13", ["AEOLIAN"]: "-11♭13",
  ["LOCRIAN"]: "",
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

