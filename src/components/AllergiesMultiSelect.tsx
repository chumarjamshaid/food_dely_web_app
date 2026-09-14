"use client";
import { useAllergies } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Props {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  size?: "default" | "compact";
}

export default function AllergiesMultiSelect({
  selectedIds,
  onChange,
  label = "Allergies",
  size = "default",
}: Props) {
  const { data, isLoading } = useAllergies(true);
  const list = data ?? [];

  function toggle(id: number) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  const padding = size === "compact" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <div>
      <span className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
      </span>
      {isLoading ? (
        <LoadingSpinner label="Loading allergies…" className="justify-start text-xs" />
      ) : list.length === 0 ? (
        <p className="text-xs text-gray-500">No allergies available.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {list.map((a) => {
            const selected = selectedIds.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.id)}
                className={`${padding} rounded-full border font-medium transition-colors ${
                  selected
                    ? "bg-[#CD3625] text-white border-[#CD3625]"
                    : "bg-white text-black border-gray-300 hover:bg-gray-50"
                }`}
              >
                {a.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function allergyIdsFrom(
  list: Array<{ id: number } | number> | undefined | null,
): number[] {
  if (!list) return [];
  return list.map((x) => (typeof x === "number" ? x : x.id));
}
