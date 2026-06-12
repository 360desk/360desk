import categoryTreeJson from "@/data/category-tree.json";

export const CATEGORY_TREE = categoryTreeJson as Record<
  string,
  Record<string, Record<string, string[]>>
>;

export interface CategorySelection {
  category_main: string;
  category_type: string;
  category_group: string;
  category_sub: string | null;
}

export function getMainOptions(): string[] {
  return Object.keys(CATEGORY_TREE);
}

export function getTypeOptions(main: string): string[] {
  const branch = CATEGORY_TREE[main];
  return branch ? Object.keys(branch) : [];
}

export function getGroupOptions(main: string, type: string): string[] {
  const branch = CATEGORY_TREE[main];
  if (!branch) return [];
  const typeBranch = branch[type];
  return typeBranch ? Object.keys(typeBranch) : [];
}

export function getSubOptions(
  main: string,
  type: string,
  group: string
): string[] {
  const branch = CATEGORY_TREE[main];
  if (!branch) return [];
  const typeBranch = branch[type];
  if (!typeBranch) return [];
  const subs = typeBranch[group];
  return subs ? [...subs] : [];
}

export function hasSubOptions(
  main: string,
  type: string,
  group: string
): boolean {
  return getSubOptions(main, type, group).length > 0;
}

export function getDefaultCategorySelection(): CategorySelection {
  const category_main = getMainOptions()[0];
  const category_type = getTypeOptions(category_main)[0];
  const category_group = getGroupOptions(category_main, category_type)[0];
  const subs = getSubOptions(category_main, category_type, category_group);

  return {
    category_main,
    category_type,
    category_group,
    category_sub: subs[0] ?? null,
  };
}

export function normalizeCategorySelection(
  selection: CategorySelection
): CategorySelection {
  const types = getTypeOptions(selection.category_main);
  const category_type = types.includes(selection.category_type)
    ? selection.category_type
    : types[0];

  const groups = getGroupOptions(selection.category_main, category_type);
  const category_group = groups.includes(selection.category_group)
    ? selection.category_group
    : groups[0];

  const subs = getSubOptions(
    selection.category_main,
    category_type,
    category_group
  );
  const category_sub =
    subs.length === 0
      ? null
      : subs.includes(selection.category_sub ?? "")
        ? selection.category_sub
        : subs[0];

  return {
    category_main: selection.category_main,
    category_type,
    category_group,
    category_sub,
  };
}

export function buildCategoryPath(selection: CategorySelection): string {
  return [
    selection.category_main,
    selection.category_type,
    selection.category_group,
    selection.category_sub,
  ]
    .filter(Boolean)
    .join(" › ");
}

export function formatCategoryFromAd(ad: {
  category_main?: string | null;
  category_type?: string | null;
  category_group?: string | null;
  category_sub?: string | null;
  category?: string;
}): string {
  if (ad.category_main && ad.category_type && ad.category_group) {
    return buildCategoryPath({
      category_main: ad.category_main,
      category_type: ad.category_type,
      category_group: ad.category_group,
      category_sub: ad.category_sub ?? null,
    });
  }
  return ad.category ?? "GAYRİMENKUL";
}

export const CATEGORY_LABELS = {
  main: "Ana Kategori",
  type: "İşlem Tipi",
  group: "Emlak Grubu",
  sub: "Alt Tip",
} as const;
