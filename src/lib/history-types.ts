export type Language = "ru" | "kk";

export type LocalizedText = {
  ru: string;
  kk: string;
};

export type HistorySource = {
  title: string;
  url: string;
  publisher: string;
};

export type HistoryRecord = {
  id: string;
  slug: string;
  type: "event" | "person";
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  significance: LocalizedText | null;
  category: string;
  startYear: number;
  endYear: number | null;
  dateLabel: LocalizedText;
  location: LocalizedText;
  coordinates: [number, number] | null;
  locationKind: "period" | "biographical" | "event";
  sources: HistorySource[];
};
