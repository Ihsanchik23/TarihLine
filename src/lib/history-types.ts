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

export type HistoryRelation = {
  id: string;
  fromRecordId: string;
  toRecordId: string;
  type: string;
  explanation: LocalizedText;
  fromYear: number | null;
  toYear: number | null;
};

export type HistoricalMapLayer = {
  id: string;
  title: LocalizedText;
  areaLabel: LocalizedText;
  snapshotYear: number;
  validFrom: number;
  validTo: number;
  changeYears: number[];
  changeSummary: Record<string, { appeared: number; disappeared: number; changed: number }>;
  geojsonUrl: string;
  administrativeLevel: string;
  coverage: string;
  reconstruction: boolean;
  license: string;
  priority: number;
  source: HistorySource;
};
