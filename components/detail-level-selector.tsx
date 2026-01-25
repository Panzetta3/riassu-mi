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
            className={`rounded-lg border-2 p-3 text-left transition-all ${
              value === option.value
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
            } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  value === option.value
                    ? "border-blue-500 dark:border-blue-400"
                    : "border-gray-400 dark:border-gray-500"
                }`}
              >
                {value === option.value && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                )}
              </div>
              <span
                className={`font-medium ${
                  value === option.value
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {option.label}
              </span>
            </div>
            <p
              className={`mt-1 text-xs ${
                value === option.value
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
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
