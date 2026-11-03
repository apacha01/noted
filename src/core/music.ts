export type Accidental = "natural" | "sharp";

export interface Pitch {
  id: string;
  letter: "C" | "D" | "E" | "F" | "G" | "A" | "B";
  accidental: Accidental;
  semitone: number;
  blackAfter?: number;
  flatLetter?: Pitch["letter"];
}

export const CHROMATIC_PITCHES: readonly Pitch[] = [
  { id: "c", letter: "C", accidental: "natural", semitone: 0 },
  { id: "c-sharp", letter: "C", accidental: "sharp", semitone: 1, blackAfter: 0, flatLetter: "D" },
  { id: "d", letter: "D", accidental: "natural", semitone: 2 },
  { id: "d-sharp", letter: "D", accidental: "sharp", semitone: 3, blackAfter: 1, flatLetter: "E" },
  { id: "e", letter: "E", accidental: "natural", semitone: 4 },
  { id: "f", letter: "F", accidental: "natural", semitone: 5 },
  { id: "f-sharp", letter: "F", accidental: "sharp", semitone: 6, blackAfter: 3, flatLetter: "G" },
  { id: "g", letter: "G", accidental: "natural", semitone: 7 },
  { id: "g-sharp", letter: "G", accidental: "sharp", semitone: 8, blackAfter: 4, flatLetter: "A" },
  { id: "a", letter: "A", accidental: "natural", semitone: 9 },
  { id: "a-sharp", letter: "A", accidental: "sharp", semitone: 10, blackAfter: 5, flatLetter: "B" },
  { id: "b", letter: "B", accidental: "natural", semitone: 11 },
] as const;

export const NATURAL_PITCHES = CHROMATIC_PITCHES.filter((pitch) => pitch.accidental === "natural");

const SOLFEGE: Record<Pitch["letter"], string> = {
  C: "Do",
  D: "Re",
  E: "Mi",
  F: "Fa",
  G: "Sol",
  A: "La",
  B: "Si",
};

export function pitchSpelling(pitch: Pitch, preference: "sharp" | "flat" = "sharp") {
  const useFlat = pitch.accidental === "sharp" && preference === "flat";
  return {
    letter: useFlat ? pitch.flatLetter! : pitch.letter,
    accidental: pitch.accidental === "natural" ? "" : useFlat ? "b" : "#",
    symbol: pitch.accidental === "natural" ? "" : useFlat ? "♭" : "♯",
  } as const;
}

export function formatPitch(pitch: Pitch, naming: "letters" | "solfege", preference: "sharp" | "flat" = "sharp"): string {
  const spelling = pitchSpelling(pitch, preference);
  const name = naming === "letters" ? spelling.letter : SOLFEGE[spelling.letter];
  return `${name}${spelling.symbol}`;
}

export function eligiblePitches(accidentals: boolean): readonly Pitch[] {
  return accidentals ? CHROMATIC_PITCHES : NATURAL_PITCHES;
}

export function shuffled<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
