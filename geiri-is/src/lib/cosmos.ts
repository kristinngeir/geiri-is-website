import { CosmosClient, type Container } from "@azure/cosmos";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function isCosmosConfigured() {
  return Boolean(process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY);
}

let cosmosClient: CosmosClient | null = null;

function getClient(): CosmosClient {
  if (!isCosmosConfigured()) {
    throw new Error("Cosmos DB is not configured. Set COSMOS_ENDPOINT and COSMOS_KEY.");
  }

  if (!cosmosClient) {
    cosmosClient = new CosmosClient({
      endpoint: requireEnv("COSMOS_ENDPOINT"),
      key: requireEnv("COSMOS_KEY"),
    });
  }

  return cosmosClient;
}

export function cosmosEnabled() {
  return isCosmosConfigured();
}

export function getContainer(containerId: string): Container {
  const databaseId = process.env.COSMOS_DATABASE_ID || "geiri-is";
  return getClient().database(databaseId).container(containerId);
}
