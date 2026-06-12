"use client";

import { Select } from "@/components/ui/Select";
import { CategoryPathPreview } from "@/components/ads/CategoryPathPreview";
import {
  CATEGORY_LABELS,
  getGroupOptions,
  getMainOptions,
  getSubOptions,
  getTypeOptions,
  hasSubOptions,
  normalizeCategorySelection,
  type CategorySelection,
} from "@/lib/categories";

interface CategoryCascadingSelectProps {
  value: CategorySelection;
  onChange: (value: CategorySelection) => void;
  disabled?: boolean;
}

export function CategoryCascadingSelect({
  value,
  onChange,
  disabled,
}: CategoryCascadingSelectProps) {
  const mainOptions = getMainOptions();
  const typeOptions = getTypeOptions(value.category_main);
  const groupOptions = getGroupOptions(value.category_main, value.category_type);
  const subOptions = getSubOptions(
    value.category_main,
    value.category_type,
    value.category_group
  );
  const showSub = hasSubOptions(
    value.category_main,
    value.category_type,
    value.category_group
  );

  const update = (partial: Partial<CategorySelection>) => {
    onChange(
      normalizeCategorySelection({
        ...value,
        ...partial,
      })
    );
  };

  return (
    <div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Select
        label={CATEGORY_LABELS.main}
        value={value.category_main}
        disabled={disabled}
        onChange={(e) => update({ category_main: e.target.value })}
        options={mainOptions.map((o) => ({ value: o, label: o }))}
        className="border-cream/15 focus:border-primary"
      />
      <Select
        label={CATEGORY_LABELS.type}
        value={value.category_type}
        disabled={disabled || typeOptions.length === 0}
        onChange={(e) => update({ category_type: e.target.value })}
        options={typeOptions.map((o) => ({ value: o, label: o }))}
      />
      <Select
        label={CATEGORY_LABELS.group}
        value={value.category_group}
        disabled={disabled || groupOptions.length === 0}
        onChange={(e) => update({ category_group: e.target.value })}
        options={groupOptions.map((o) => ({ value: o, label: o }))}
      />
      {showSub && (
        <Select
          label={CATEGORY_LABELS.sub}
          value={value.category_sub ?? subOptions[0]}
          disabled={disabled}
          onChange={(e) => update({ category_sub: e.target.value })}
          options={subOptions.map((o) => ({ value: o, label: o }))}
        />
      )}
    </div>
    <CategoryPathPreview selection={value} />
    </div>
  );
}
