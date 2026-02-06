"use client";

export type DetailLevel = "brief" | "medium" | "detailed";

interface DetailLevelOption {
  value: DetailLevel;
  label: string;
  description: string;
}

const detailLevelOptions: DetailLevelOption[] = [
  {
    value: "brief",
    label: "Breve",
    description: "Bullet points dei concetti chiave",
  },
  {
    value: "medium",
    label: "Medio",
    description: "1-2 paragrafi per sezione",
  },
  {
    value: "detailed",
    label: "Dettagliato",
    description: "Spiegazioni complete con esempi",
  },
];

interface DetailLevelSelectorProps {
  value: DetailLevel;
  onChange: (value: DetailLevel) => void;
  disabled?: boolean;
}

export function DetailLevelSelector({
  value,
  onChange,
  disabled = false,
}: DetailLevelSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Livello di dettaglio
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        {detailLevelOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${
              value === option.value
                ? "border-[color:var(--brand)] bg-[color:color-mix(in_oklab,var(--brand)_12%,transparent)]"
                : "border-[color:var(--border)] bg-[color:var(--card)] hover:border-[color:color-mix(in_oklab,var(--brand)_30%,var(--border))]"
            } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  value === option.value
                    ? "border-[color:var(--brand)]"
                    : "border-[color:var(--border)]"
                }`}
              >
                {value === option.value && (
                  <div className="h-2 w-2 rounded-full bg-[color:var(--brand)]" />
                )}
              </div>
              <span
                className={`font-medium ${
                  value === option.value
                    ? "text-[color:var(--brand)]"
                    : "text-[color:var(--ink)]"
                }`}
              >
                {option.label}
              </span>
            </div>
            <p
              className={`mt-1 text-xs ${
                value === option.value
                  ? "text-[color:var(--brand)]"
                  : "text-[color:var(--muted)]"
              }`}
            >
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export { detailLevelOptions };
