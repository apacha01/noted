import { useEffect, useRef } from "preact/hooks";
import { pitchSpelling, type Pitch } from "../core/music";

interface StaffNoteProps {
  pitch: Pitch;
  clef: "treble" | "bass";
  spelling: "sharp" | "flat";
  accessibleLabel: string;
}

export default function StaffNote({ pitch, clef, spelling: spellingPreference, accessibleLabel }: StaffNoteProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host.current) return;
    let cancelled = false;

    void import("vexflow").then(({ Accidental, Formatter, Renderer, Stave, StaveNote, Voice }) => {
      if (cancelled || !host.current) return;
      host.current.replaceChildren();

      const renderer = new Renderer(host.current, Renderer.Backends.SVG);
      renderer.resize(320, 190);
      const context = renderer.getContext();
      const stave = new Stave(20, 35, 280);
      stave.addClef(clef).setContext(context).draw();

      const octave = clef === "treble" ? 4 : 3;
      const spelling = pitchSpelling(pitch, spellingPreference);
      const note = new StaveNote({
        clef,
        keys: [`${spelling.letter.toLowerCase()}${spelling.accidental}/${octave}`],
        duration: "q",
      });
      if (spelling.accidental) note.addModifier(new Accidental(spelling.accidental), 0);

      const voice = new Voice({ numBeats: 1, beatValue: 4 });
      voice.addTickables([note]);
      new Formatter().joinVoices([voice]).format([voice], 120);
      voice.draw(context, stave);
    });

    return () => { cancelled = true; };
  }, [pitch.id, clef, spellingPreference]);

  return <div class="staff-note" ref={host} role="img" aria-label={accessibleLabel} />;
}
