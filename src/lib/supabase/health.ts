import { createClient } from "./server";

export type FoundationStatus = {
  connected: boolean;
  label: string;
  detail: string;
  records: number | null;
};

export async function getFoundationStatus(): Promise<FoundationStatus> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("historical_records")
      .select("id", { count: "exact", head: true });

    if (error) {
      return {
        connected: false,
        label: "Схема данных недоступна",
        detail: "Соединение установлено, запрос требует проверки",
        records: null,
      };
    }

    return {
      connected: true,
      label: "Supabase подключён",
      detail: `Схема отвечает · записей: ${count ?? 0}`,
      records: count ?? 0,
    };
  } catch {
    return {
      connected: false,
      label: "Supabase временно недоступен",
      detail: "Приложение продолжает работать без данных",
      records: null,
    };
  }
}
