// Temporary token storage for context passing
// This is used because Apollo Server's executeOperation doesn't easily accept context
export const tokenStore = {
    current: undefined as string | undefined
};

export function setCurrentToken(token: string | undefined) {
    tokenStore.current = token;
}

export function getCurrentToken(): string | undefined {
    return tokenStore.current;
}
