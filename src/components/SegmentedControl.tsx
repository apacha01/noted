interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export default function SegmentedControl<T extends string>({ label, value, options, onChange, disabled = false }: SegmentedControlProps<T>) {
  return (
    <fieldset class={`setting-field ${disabled ? "is-disabled" : ""}`} disabled={disabled}>
      <legend>{label}</legend>
      <div class="segmented">
        {options.map((option) => (
          <button
            type="button"
            disabled={disabled}
            class={value === option.value ? "is-active" : ""}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
