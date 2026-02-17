import type { LinkedInAuthSecret } from "@/lib/types";
import { cosmosEnabled, getContainer } from "@/lib/cosmos";

const SECRETS_CONTAINER = process.env.COSMOS_SECRETS_CONTAINER_ID || "secrets";

const inMemory = {
  linkedInAuth: null as LinkedInAuthSecret | null,
};

export async function getLinkedInAuthSecret(): Promise<LinkedInAuthSecret | null> {
  if (!cosmosEnabled()) {
    return inMemory.linkedInAuth;
  }

  const container = getContainer(SECRETS_CONTAINER);
  try {
    const { resource } = await container.item("linkedinAuth", "secret").read<LinkedInAuthSecret>();
    return resource || null;
  } catch {
    return null;
  }
}

export async function setLinkedInAuthSecret(secret: LinkedInAuthSecret): Promise<void> {
  if (!cosmosEnabled()) {
    inMemory.linkedInAuth = secret;
    return;
  }

  const container = getContainer(SECRETS_CONTAINER);
  try {
    await container.item("linkedinAuth", "secret").replace(secret);
  } catch {
    await container.items.create(secret);
  }
}
