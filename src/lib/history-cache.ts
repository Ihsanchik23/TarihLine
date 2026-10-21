import { updateTag } from "next/cache";

export const HISTORY_CACHE_TAG = "tarihline-history";

export function invalidateHistoryCache() {
  updateTag(HISTORY_CACHE_TAG);
}
