var player = player || {};

player.Bass = class {
  constructor() {
    this.sampleLength = 120;
    this.sampleFolderPath = "../assets/bass-samples/";
    this.BASS_SAMPLES = { ["E1"]: "E1.mp3", ["F1"]: "F1.mp3", ["F#1"]: "Fs1.mp3", ["G1"]: "G1.mp3", ["G#1"]: "Gs1.mp3", ["A1"]: "A1.mp3", ["A#1"]: "As1.mp3", ["B1"]: "B1.mp3",
      ["C2"]: "C2.mp3", ["C#2"]: "Cs2.mp3", ["D2"]: "D2.mp3", ["D#2"]: "Ds2.mp3", ["E2"]: "E2.mp3", ["F2"]: "F2.mp3", ["F#2"]: "Fs2.mp3", ["G2"]: "G2.mp3", ["G#2"]: "Gs2.mp3", ["A2"]: "A2.mp3", ["A#2"]: "As2.mp3", ["B2"]: "B2.mp3",
      ["C3"]: "C3.mp3", ["C#3"]: "Cs3.mp3", ["D3"]: "D3.mp3", ["D#3"]: "Ds3.mp3", ["E3"]: "E3.mp3", ["F3"]: "F3.mp3", ["F#3"]: "Fs3.mp3", ["G3"]: "G3.mp3", ["G#3"]: "Gs3.mp3", ["A3"]: "A3.mp3", ["A#3"]: "As3.mp3", ["B3"]: "B3.mp3", ["C4"]: "C4.mp3",
    };
  }

  getSampleAtBeat(measure, beat) {
    let totalBeat = (measure * 4)
  }

  loadChorus(chords) {
    this.bassLine = [];

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
        this.bassLine.push(e);
      });
    });
  }

  LT(chord) {
    let leadingTones = [];
    leadingTones.push(chord.root.addInterval(theory.INTERVALS.m2));
    leadingTones.push(chord.root.subtractInterval(theory.INTERVALS.m2));
    leadingTones.push(chord.getNoteAtScaleDegree(2));

    leadingTones.push(chord.getNoteAtScaleDegree(5));
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
    let aDegree = chord.getScaleDegreeOfNote(a);
    let bDegree = chord.getScaleDegreeOfNote(b);
    return chord.getNoteAtScaleDegree(((Math.floor((aDegree + bDegree) / 2)) % 7) + 1);
  }

}


player.AUDIO_CONTEXT = new AudioContext();

musician.BassPlayer = class {
  constructor() {
    this.isPlaying = false;
    this.songTimers = [];

    this.DRUM_LOOP = this.createSample("../drum-samples/swing_loop_182bpm.wav");
    this.DRUM_LOOP.volume = 0.5;

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
          this.BASS_SAMPLES[str + "2"].playbackRate = 2;
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

    leadingTones.push(chord.getNoteAtScaleDegree(5));
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
    let aDegree = chord.getScaleDegreeOfNote(a);
    let bDegree = chord.getScaleDegreeOfNote(b);
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