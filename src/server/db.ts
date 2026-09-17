import postgres, { type Sql } from "postgres";

import { serverEnv } from "./env";

let readClient: Sql | undefined;
let syncClient: Sql | undefined;

function createClient(url: string): Sql {
  return postgres(url, {
    max: 4,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    transform: { undefined: null },
  });
}

export function analyticsDb(): Sql {
  readClient ??= createClient(serverEnv().analyticsDatabaseUrl);
  return readClient;
}

export function analyticsSyncDb(): Sql {
  syncClient ??= createClient(serverEnv().analyticsSyncDatabaseUrl);
  return syncClient;
}
