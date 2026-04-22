import type { DbAdapter, DbStoreKind } from "./types";
import { createMemoryAdapter } from "./memory";

let cached: DbAdapter | null = null;

export function getDb(): DbAdapter {
  if (cached) return cached;
  const kind = (process.env.DATA_STORE || "memory").toLowerCase() as DbStoreKind;
  switch (kind) {
    case "mongodb": {
      // Lazy require so MongoDB native deps aren't loaded in memory mode.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createMongoAdapter } = require("./mongodb");
      cached = createMongoAdapter();
      break;
    }
    case "dynamodb": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createDynamoAdapter } = require("./dynamodb");
      cached = createDynamoAdapter();
      break;
    }
    default:
      cached = createMemoryAdapter();
  }
  return cached!;
}

export type { DbAdapter, DbStoreKind } from "./types";
