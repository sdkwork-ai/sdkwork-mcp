import { isBlank, trim } from '@sdkwork/utils';
import { createTokenManager, type AuthTokenManager } from '@sdkwork/sdk-common';

const AUTH_TOKEN_KEY = 'sdkwork-mcp-auth-token';
const ACCESS_TOKEN_KEY = 'sdkwork-mcp-access-token';

function resolveStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  migrateLegacyToken(AUTH_TOKEN_KEY);
  migrateLegacyToken(ACCESS_TOKEN_KEY);
  return window.localStorage;
}

function migrateLegacyToken(key: string): void {
  const legacyToken = window.sessionStorage.getItem(key);
  if (legacyToken && !window.localStorage.getItem(key)) {
    window.localStorage.setItem(key, legacyToken);
  }
  if (legacyToken) {
    window.sessionStorage.removeItem(key);
  }
}

function readToken(key: string): string | undefined {
  const storage = resolveStorage();
  const fromStorage = trim(storage?.getItem(key) ?? '');
  return isBlank(fromStorage) ? undefined : fromStorage;
}

export function readStoredAuthToken(): string | undefined {
  return readToken(AUTH_TOKEN_KEY);
}

export function readStoredAccessToken(): string | undefined {
  return readToken(ACCESS_TOKEN_KEY);
}

export function clearStoredTokens(): void {
  resolveStorage()?.removeItem(AUTH_TOKEN_KEY);
  resolveStorage()?.removeItem(ACCESS_TOKEN_KEY);
}

export function createMCPTokenManager(): AuthTokenManager {
  // Deliberately credential-source-agnostic. The bootstrap Access-Token fallback
  // (`IAM_CREDENTIAL_ENTRY_SPEC` section 4/5, `APP_SDK_INTEGRATION_SPEC` section 4)
  // belongs to the *host* projection, not to this package-level default: the
  // renderer host injects its own session-backed manager through
  // `MCPClientsProvider clients={...}` (`apps/sdkwork-mcp-pc/src/bootstrap/
  // sessionTokenManager.ts`), and shared consumers of `getMCPClients()` are
  // bundled by hosts outside this repository. Making this fallback read the
  // credential explicitly would force every such host to carry the private
  // credential-entry dependency for a path it never executes.
  return createTokenManager();
}

export function hasStoredSession(): boolean {
  return !isBlank(readStoredAuthToken()) && !isBlank(readStoredAccessToken());
}
