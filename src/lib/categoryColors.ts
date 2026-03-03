export interface CategoryTheme {
  accent: string;
  accentMuted: string;
  accentText: string;
  activeDot: string;
}

const palette: CategoryTheme[] = [
  { accent: "#64748b", accentMuted: "#f1f5f9", accentText: "#475569", activeDot: "#64748b" },  // slate
  { accent: "#6b8f71", accentMuted: "#f0f4f0", accentText: "#4a6b4f", activeDot: "#6b8f71" },  // sage
  { accent: "#78716c", accentMuted: "#f5f5f4", accentText: "#57534e", activeDot: "#78716c" },  // stone
  { accent: "#b4838d", accentMuted: "#fdf2f4", accentText: "#9f616d", activeDot: "#b4838d" },  // dusty-rose
  { accent: "#6b8dad", accentMuted: "#f0f4f8", accentText: "#4a6f8f", activeDot: "#6b8dad" },  // muted-blue
  { accent: "#8f8b83", accentMuted: "#f7f6f4", accentText: "#6b6860", activeDot: "#8f8b83" },  // warm-gray
  { accent: "#5f9ea0", accentMuted: "#f0f7f7", accentText: "#4a7c7e", activeDot: "#5f9ea0" },  // soft-teal
  { accent: "#8b7d9b", accentMuted: "#f5f3f7", accentText: "#6d5f7d", activeDot: "#8b7d9b" },  // mauve
];

const cache = new Map<string, CategoryTheme>();

export function getCategoryColor(category: string, allCategories: string[]) {
  const key = `${category}::${allCategories.length}`;
  if (cache.has(key)) return cache.get(key)!;

  const sorted = [...allCategories].sort();
  const idx = sorted.indexOf(category);
  const color = palette[idx >= 0 ? idx % palette.length : 0];
  cache.set(key, color);
  return color;
}
