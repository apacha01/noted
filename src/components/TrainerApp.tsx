import { useEffect, useMemo, useState } from "preact/hooks";
import { eligiblePitches, formatPitch, shuffled, type Pitch } from "../core/music";
import { translate, type Language, type MessageKey } from "../core/i18n";
import PianoKeyboard from "./PianoKeyboard";
import StaffNote from "./StaffNote";
import SegmentedControl from "./SegmentedControl";

type Mode = "piano-name" | "name-piano" | "staff-name" | "staff-piano";
type Naming = "letters" | "solfege";
type AccidentalSpelling = "sharp" | "flat" | "mixed";
type Theme = "system" | "light" | "dark";
type ClefSetting = "treble" | "bass" | "mixed";
type Screen = "setup" | "practice" | "results";

interface Settings {
  language: Language;
  naming: Naming;
  theme: Theme;
  mode: Mode;
  accidentals: boolean;
  accidentalSpelling: AccidentalSpelling;
  clef: ClefSetting;
  selectedPitchIds: string[];
}

interface Question {
  pitch: Pitch;
  clef: "treble" | "bass";
  spelling: "sharp" | "flat";
}

interface Answer {
  pitch: Pitch;
  selected: Pitch;
  correct: boolean;
}

interface Stats {
  attempts: number;
  correct: number;
}

const DEFAULT_SETTINGS: Settings = {
  language: "en",
  naming: "letters",
  theme: "system",
  mode: "piano-name",
  accidentals: false,
  accidentalSpelling: "sharp",
  clef: "treble",
  selectedPitchIds: eligiblePitches(true).map((pitch) => pitch.id),
};

const MODES: { id: Mode; icon: string; title: MessageKey; description: MessageKey }[] = [
  { id: "piano-name", icon: "♩", title: "pianoName", description: "pianoNameDesc" },
  { id: "name-piano", icon: "C", title: "namePiano", description: "namePianoDesc" },
  { id: "staff-name", icon: "𝄞", title: "staffName", description: "staffNameDesc" },
  { id: "staff-piano", icon: "♫", title: "staffPiano", description: "staffPianoDesc" },
];

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? { ...fallback, ...JSON.parse(value) } : fallback;
  } catch {
    return fallback;
  }
}

export default function TrainerApp() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<Stats>({ attempts: 0, correct: 0 });
  const [storageReady, setStorageReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<Pitch | null>(null);

  const t = (key: MessageKey, values?: Record<string, string | number>) => translate(settings.language, key, values);
  const pitches = useMemo(() => eligiblePitches(settings.accidentals), [settings.accidentals]);
  const selectedPitches = useMemo(
    () => pitches.filter((pitch) => settings.selectedPitchIds.includes(pitch.id)),
    [pitches, settings.selectedPitchIds],
  );
  const current = questions[index];
  const isStaffMode = settings.mode.startsWith("staff");

  useEffect(() => {
    setSettings(readStored("noted:settings", DEFAULT_SETTINGS));
    setStats(readStored("noted:stats", { attempts: 0, correct: 0 }));
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (storageReady) window.localStorage.setItem("noted:settings", JSON.stringify(settings));
  }, [settings, storageReady]);

  useEffect(() => {
    if (storageReady) window.localStorage.setItem("noted:stats", JSON.stringify(stats));
  }, [stats, storageReady]);

  useEffect(() => {
    if (storageReady) window.localStorage.setItem("noted:theme", settings.theme);
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = settings.theme === "dark" || (settings.theme === "system" && media.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#171a17" : "#f4eddf");
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings.theme, storageReady]);

  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const toggleAccidentals = () => {
    update("accidentals", !settings.accidentals);
  };

  const makeClef = (): "treble" | "bass" => {
    if (settings.clef === "mixed") return Math.random() < 0.5 ? "treble" : "bass";
    return settings.clef;
  };

  const makeSpelling = (): "sharp" | "flat" => {
    if (settings.accidentalSpelling === "mixed") return Math.random() < 0.5 ? "sharp" : "flat";
    return settings.accidentalSpelling;
  };

  const makeRound = (lastPitchId?: string): Question[] => {
    const round = shuffled(selectedPitches);
    if (round.length > 1 && round[0].id === lastPitchId) {
      [round[0], round[1]] = [round[1], round[0]];
    }
    return round.map((pitch) => ({ pitch, clef: makeClef(), spelling: makeSpelling() }));
  };

  const startSession = () => {
    if (selectedPitches.length === 0) return;
    const sessionQuestions = makeRound();
    setQuestions(sessionQuestions);
    setAnswers([]);
    setIndex(0);
    setSelected(null);
    setScreen("practice");
  };

  const answer = (pitch: Pitch) => {
    if (selected || !current) return;
    const correct = pitch.id === current.pitch.id;
    setSelected(pitch);
    setAnswers((previous) => [...previous, { pitch: current.pitch, selected: pitch, correct }]);
    setStats((previous) => ({ attempts: previous.attempts + 1, correct: previous.correct + (correct ? 1 : 0) }));
  };

  const advance = () => {
    if (index >= questions.length - 1) {
      setQuestions(makeRound(current.pitch.id));
      setIndex(0);
      setSelected(null);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
  };

  const labelFor = (pitch: Pitch, spelling: "sharp" | "flat" = current?.spelling ?? "sharp") =>
    formatPitch(pitch, settings.naming, spelling);
  const selectionLabelFor = (pitch: Pitch) => {
    if (pitch.accidental === "sharp" && settings.accidentalSpelling === "mixed") {
      return `${formatPitch(pitch, settings.naming, "sharp")} / ${formatPitch(pitch, settings.naming, "flat")}`;
    }
    const spelling = settings.accidentalSpelling === "mixed" ? "sharp" : settings.accidentalSpelling;
    return formatPitch(pitch, settings.naming, spelling);
  };
  const togglePitch = (pitchId: string) => {
    setSettings((previous) => ({
      ...previous,
      selectedPitchIds: previous.selectedPitchIds.includes(pitchId)
        ? previous.selectedPitchIds.filter((id) => id !== pitchId)
        : [...previous.selectedPitchIds, pitchId],
    }));
  };
  const setAllVisiblePitches = (selected: boolean) => {
    const visibleIds = pitches.map((pitch) => pitch.id);
    setSettings((previous) => ({
      ...previous,
      selectedPitchIds: selected
        ? [...new Set([...previous.selectedPitchIds, ...visibleIds])]
        : previous.selectedPitchIds.filter((id) => !visibleIds.includes(id)),
    }));
  };
  const correctCount = answers.filter((item) => item.correct).length;
  const promptKey: Record<Mode, MessageKey> = {
    "piano-name": "chooseName",
    "name-piano": "findKey",
    "staff-name": "readStaff",
    "staff-piano": "staffToKey",
  };

  return (
    <div class="app-shell">
      <header class="site-header">
        <button class="brand" type="button" onClick={() => setScreen("setup")} aria-label="Noted home">
          <span class="brand-mark" aria-hidden="true">♪</span>
          <span>noted</span>
        </button>
        <div class="header-actions">
          <button
            class="icon-button"
            type="button"
            aria-label={`${t("theme")}: ${t(settings.theme)}`}
            title={`${t("theme")}: ${t(settings.theme)}`}
            onClick={() => update("theme", settings.theme === "system" ? "light" : settings.theme === "light" ? "dark" : "system")}
          >
            <span aria-hidden="true">{settings.theme === "system" ? "◐" : settings.theme === "light" ? "☀" : "☾"}</span>
          </button>
          <button class="language-button" type="button" onClick={() => update("language", settings.language === "en" ? "es" : "en")}>
            {settings.language === "en" ? "ES" : "EN"}
          </button>
        </div>
      </header>

      <main>
        {screen === "setup" && (
          <div class="setup-page">
            <section class="hero">
              <p class="eyebrow">{t("practice")}</p>
              <h1>Read it. Find it.<br /><em>Remember it.</em></h1>
              <p>{t("tagline")}</p>
            </section>

            <section aria-labelledby="mode-heading">
              <div class="section-heading">
                <div>
                  <p class="section-number">01</p>
                  <h2 id="mode-heading">{t("practice")}</h2>
                </div>
              </div>
              <div class="mode-grid">
                {MODES.map((mode) => (
                  <button
                    type="button"
                    class={`mode-card ${settings.mode === mode.id ? "is-selected" : ""}`}
                    aria-pressed={settings.mode === mode.id}
                    onClick={() => update("mode", mode.id)}
                  >
                    <span class="mode-icon" aria-hidden="true">{mode.icon}</span>
                    <span class="mode-copy">
                      <strong>{t(mode.title)}</strong>
                      <small>{t(mode.description)}</small>
                    </span>
                    <span class="radio-dot"><span /></span>
                  </button>
                ))}
              </div>
            </section>

            <section class="settings-card" aria-labelledby="settings-heading">
              <div class="section-heading compact">
                <div>
                  <p class="section-number">02</p>
                  <h2 id="settings-heading">{t("settings")}</h2>
                </div>
              </div>

              <div class="settings-grid">
                <SegmentedControl
                  label={t("naming")}
                  value={settings.naming}
                  options={[{ value: "letters", label: "C D E" }, { value: "solfege", label: "Do Re Mi" }]}
                  onChange={(value) => update("naming", value)}
                />
                <SegmentedControl
                  label={t("theme")}
                  value={settings.theme}
                  options={(["system", "light", "dark"] as Theme[]).map((value) => ({ value, label: t(value) }))}
                  onChange={(value) => update("theme", value)}
                />
                {isStaffMode && (
                  <SegmentedControl
                    label={t("clef")}
                    value={settings.clef}
                    options={(["treble", "bass", "mixed"] as ClefSetting[]).map((value) => ({ value, label: t(value) }))}
                    onChange={(value) => update("clef", value)}
                  />
                )}
                <SegmentedControl
                  label={t("spelling")}
                  value={settings.accidentalSpelling}
                  options={(["sharp", "flat", "mixed"] as AccidentalSpelling[]).map((value) => ({
                    value,
                    label: t(value === "sharp" ? "sharps" : value === "flat" ? "flats" : "mixed"),
                  }))}
                  onChange={(value) => update("accidentalSpelling", value)}
                  disabled={!settings.accidentals}
                />
                <div class="setting-field toggle-field">
                  <div>
                    <span class="field-label">{t("accidentals")}</span>
                    <small>{t(settings.accidentals ? "chromaticCount" : "naturalsCount")}</small>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.accidentals}
                    class={`switch ${settings.accidentals ? "is-on" : ""}`}
                    onClick={toggleAccidentals}
                  ><span /></button>
                </div>
                <div class="setting-field note-picker-field">
                  <div class="note-picker-heading">
                    <div>
                      <span class="field-label">{t("notesToPractice")}</span>
                      <small>{t("notesHelp")}</small>
                    </div>
                    <span class="selection-count">{t("selectedCount", { count: selectedPitches.length })}</span>
                  </div>
                  <div class="note-picker-actions">
                    <button type="button" onClick={() => setAllVisiblePitches(true)}>{t("selectAll")}</button>
                    <button type="button" onClick={() => setAllVisiblePitches(false)}>{t("clearAll")}</button>
                  </div>
                  <div class="note-picker-grid">
                    {pitches.map((pitch) => {
                      const isSelected = settings.selectedPitchIds.includes(pitch.id);
                      return (
                        <button
                          type="button"
                          class={isSelected ? "is-selected" : ""}
                          aria-pressed={isSelected}
                          onClick={() => togglePitch(pitch.id)}
                        >{selectionLabelFor(pitch)}</button>
                      );
                    })}
                  </div>
                  {selectedPitches.length === 0 && <p class="selection-error">{t("selectOne")}</p>}
                </div>
              </div>

              <button class="primary-button" type="button" onClick={startSession} disabled={selectedPitches.length === 0}>
                {t("start")} <span aria-hidden="true">→</span>
              </button>
            </section>

            {stats.attempts > 0 && (
              <aside class="stats-strip" aria-label={t("lifetime")}>
                <span>{t("lifetime")}</span>
                <strong>{t("attempts", { count: stats.attempts })}</strong>
                <strong>{t("accuracy", { value: Math.round((stats.correct / stats.attempts) * 100) })}</strong>
              </aside>
            )}
          </div>
        )}

        {screen === "practice" && current && (
          <section class="practice-page">
            <div class="practice-topline">
              <button class="text-button" type="button" onClick={() => setScreen("setup")}>← {t("home")}</button>
              <div class="practice-status">
                <span>{t("progress", { current: answers.length + 1 })}</span>
                {answers.length > 0 && <button class="text-button" type="button" onClick={() => setScreen("results")}>{t("finishSession")}</button>}
              </div>
            </div>
            <div class="question-card">
              <p class="eyebrow">{t(promptKey[settings.mode])}</p>
              <div class="prompt-area">
                {settings.mode === "piano-name" && (
                  <PianoKeyboard pitches={eligiblePitches(true)} highlightedId={current.pitch.id} labelFor={labelFor} />
                )}
                {settings.mode === "name-piano" && <div class="written-note">{labelFor(current.pitch, current.spelling)}</div>}
                {isStaffMode && (
                  <StaffNote
                    pitch={current.pitch}
                    clef={current.clef}
                    spelling={current.spelling}
                    accessibleLabel={`${labelFor(current.pitch, current.spelling)}, ${t(current.clef)}`}
                  />
                )}
              </div>

              {settings.mode.endsWith("name") ? (
                <div class="answer-grid">
                  {pitches.map((pitch) => (
                    <button
                      type="button"
                      disabled={Boolean(selected)}
                      class={`${selected?.id === pitch.id ? "is-selected" : ""} ${selected && current.pitch.id === pitch.id ? "is-correct" : ""} ${selected?.id === pitch.id && selected.id !== current.pitch.id ? "is-wrong" : ""}`}
                      onClick={() => answer(pitch)}
                    >{labelFor(pitch, current.spelling)}</button>
                  ))}
                </div>
              ) : (
                <PianoKeyboard
                  pitches={eligiblePitches(true)}
                  interactive
                  selectedId={selected?.id}
                  correctId={selected ? current.pitch.id : undefined}
                  disabled={Boolean(selected)}
                  labelFor={(pitch) => labelFor(pitch, current.spelling)}
                  onSelect={answer}
                />
              )}

              {selected && (
                <div class={`feedback ${selected.id === current.pitch.id ? "is-correct" : "is-wrong"}`} role="status">
                  <p>{selected.id === current.pitch.id ? t("correct") : t("incorrect", { note: labelFor(current.pitch, current.spelling) })}</p>
                  <button class="primary-button" type="button" onClick={advance}>
                    {t("next")} <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {screen === "results" && (
          <section class="results-page">
            <div class="result-mark" aria-hidden="true">✓</div>
            <p class="eyebrow">{t("results")}</p>
            <h1>{t("score", { correct: correctCount, total: answers.length })}</h1>
            <div class="result-score">
              <strong>{Math.round((correctCount / answers.length) * 100)}%</strong>
              <span>{t("accuracy", { value: Math.round((correctCount / answers.length) * 100) })}</span>
            </div>
            <div class="result-actions">
              <button class="primary-button" type="button" onClick={startSession}>{t("again")} <span>→</span></button>
              <button class="secondary-button" type="button" onClick={() => setScreen("setup")}>{t("home")}</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
