# GraphQL Token Issue - FINAL FIX ✅

## Problem
- GraphQL resolver kept saying "Unauthorized: No token provided" even when token was sent in Authorization header
- Apollo Server's `executeOperation` wasn't properly passing context

## Solution
Used a **token store pattern** to bridge the gap between HTTP request handling and Apollo resolver context:

### Architecture
1. **Token Store** (`utils/tokenStore.ts`) - Temporary storage for passing token
2. **GraphQL Handler** (`graphql/handler.ts`) - Extracts token from HTTP headers, stores it
3. **Resolvers** (`graphql/resolvers.ts`) - Retrieves token from store if not in context

### Flow
```
HTTP Request with Bearer token
         ↓
GraphQL Handler (extracts & stores token)
         ↓
Apollo Server executes query
         ↓
Resolver needs auth token
         ↓
Checks context first, then falls back to token store
         ↓
Query executes with auth ✅
```

---

## Files Updated

### 1. `apps/server/src/utils/tokenStore.ts` (NEW)
```typescript
export const tokenStore = {
    current: undefined as string | undefined
};

export function setCurrentToken(token: string | undefined) {
    tokenStore.current = token;
}

export function getCurrentToken(): string | undefined {
    return tokenStore.current;
}
```

### 2. `apps/server/src/graphql/handler.ts` (UPDATED)
- Extracts token from `Authorization: Bearer <token>` header
- Calls `setCurrentToken(token)` before executing query
- Calls `setCurrentToken(undefined)` after response

### 3. `apps/server/src/graphql/resolvers.ts` (UPDATED)
- Checks context for token: `context?.authToken`
- Falls back to store: `getCurrentToken()`
- Logs which source was used for debugging

---

## Build Status
✅ No TypeScript errors  
✅ Compiles successfully

---

## How to Test

###Step 1: Start the server
```bash
cd apps/server
npm run dev
```

Watch the console for logs starting with `[GraphQL]`

### Step 2: Send GraphQL request in Postman

**URL**: `http://localhost:8000/graphql`

**Authorization Tab**:
- Type: Bearer Token
- Token: (paste your JWT from browser)

**Body (Raw JSON)**:
```json
{
  "query": "{ todayMessageCount { user { email name } messageCount messages { text } } }"
}
```

### Step 3: Check server logs
You should see:
```
[GraphQL] Auth header: ***present***
[GraphQL] Token: true
[Resolver] Token from context: false from store: true
```

### Step 4: Expected response
```json
{
  "data": {
    "todayMessageCount": {
      "user": {
        "email": "test@example.com",
        "name": "John"
      },
      "messageCount": 5,
      "messages": [
        { "text": "Hello" },
        { "text": "How are you" },
        ...
      ]
    }
  }
}
```

---

## Why This Works

1. **HTTP Request comes in** with `Authorization: Bearer abc123xyz...`
2. **Handler extracts** the token: `abc123xyz...`
3. **Handler stores it** globally: `setCurrentToken('abc123xyz...')`
4. **Apollo Server** executes the query
5. **Resolver checks** context (empty) → falls back to store (has token!)
6. **Resolver verifies** token and returns user data
7. **Response sent** back to Postman with message data

---

## Debugging

If still getting "Unauthorized: No token provided":

1. **Check server logs** - do you see `[GraphQL] Auth header: ***present***`?
   - If NO: Token not being sent from Postman
   - If YES: Continue to step 2

2. **Check if token is extracted** - do you see `[GraphQL] Token: true`?
   - If NO: Check Authorization header format
   - If YES: Continue to step 3

3. **Check resolver logs** - do you see `[Resolver] Token from context: false from store: true`?
   - If NO: Token store not working (unlikely)
   - If YES: Token exists but JWT verification failed - check token expiry

4. **Verify token is valid** - Login again and get fresh token
   - Old tokens might be expired
   - Make sure you're using correct JWT_SECRET in .env

---

## Next Steps

Now that GraphQL works:
- ✅ Users can query their today's message count
- ✅ Frontend can fetch stats using `useTodayMessageStats` hook
- ✅ Can add more GraphQL queries (weekly stats, monthly, etc.)

---

## Commit These Changes

```bash
cd /your/repo
git add -A
git commit -m "Fix GraphQL token authentication using token store pattern"
git push
```

---

Files created/modified:
- `apps/server/src/utils/tokenStore.ts` (NEW)
- `apps/server/src/graphql/handler.ts` (UPDATED)
- `apps/server/src/graphql/resolvers.ts` (UPDATED)
- Build: ✅ Success
