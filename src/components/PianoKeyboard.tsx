import type { Pitch } from "../core/music";

interface PianoKeyboardProps {
  pitches: readonly Pitch[];
  interactive?: boolean;
  highlightedId?: string;
  selectedId?: string;
  correctId?: string;
  disabled?: boolean;
  showLabels?: boolean;
  labelFor: (pitch: Pitch) => string;
  onSelect?: (pitch: Pitch) => void;
}

const WHITE_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];

export default function PianoKeyboard({
  pitches,
  interactive = false,
  highlightedId,
  selectedId,
  correctId,
  disabled = false,
  showLabels = false,
  labelFor,
  onSelect,
}: PianoKeyboardProps) {
  const naturals = pitches.filter((pitch) => pitch.accidental === "natural");
  const sharps = pitches.filter((pitch) => pitch.accidental === "sharp");

  const stateClass = (pitch: Pitch) => {
    if (pitch.id === correctId) return "is-correct";
    if (pitch.id === selectedId && selectedId !== correctId) return "is-wrong";
    if (pitch.id === highlightedId) return "is-highlighted";
    return "";
  };

  return (
    <div class="piano-shell">
      <div class="piano" role={interactive ? "group" : "img"} aria-label="Piano keyboard">
        {WHITE_LETTERS.map((letter) => {
          const pitch = naturals.find((item) => item.letter === letter)!;
          return (
            <button
              type="button"
              class={`piano-key piano-key--white ${stateClass(pitch)}`}
              aria-label={labelFor(pitch)}
              aria-pressed={interactive ? pitch.id === selectedId : undefined}
              disabled={!interactive || disabled}
              onClick={() => onSelect?.(pitch)}
            >
              {showLabels && <span class="key-label" aria-hidden="true">{labelFor(pitch)}</span>}
            </button>
          );
        })}
        {sharps.map((pitch) => (
          <button
            type="button"
            class={`piano-key piano-key--black ${stateClass(pitch)}`}
            style={{ "--black-position": pitch.blackAfter } as Record<string, number | undefined>}
            aria-label={labelFor(pitch)}
            aria-pressed={interactive ? pitch.id === selectedId : undefined}
            disabled={!interactive || disabled}
            onClick={() => onSelect?.(pitch)}
          >
            {showLabels && <span class="key-label" aria-hidden="true">{labelFor(pitch)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
