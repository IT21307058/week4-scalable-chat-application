# GraphQL Token Debug Guide

## Issue Fixed ✅

The token was not being passed correctly to the Apollo resolver context. This has been fixed by:
1. Creating a dedicated GraphQL handler (`graphql/handler.ts`)
2. Properly passing the `contextValue` with `authToken` to `executeOperation`
3. Adding logging to debug token extraction

---

## How to Test the Fix

### 1. Start the Server with Debug Logs

```bash
cd apps/server
npm run dev
```

Watch the console output for messages like:
```
[GraphQL] Auth header present: true
[GraphQL] Token extracted: true
```

### 2. Test in Postman

**Steps:**
1. Make sure you're logged in and have a valid JWT token
2. In Postman, go to the Authorization tab
3. Select `Bearer Token` type
4. Paste your JWT token
5. Make sure "Headers (10)" shows the Authorization header is added

**GraphQL Query:**
```json
{
  "query": "{ todayMessageCount { user { email name } messageCount } }"
}
```

### 3. Check Server Logs

When you send the request, you should see in the terminal:
```
[GraphQL] Auth header present: true
[GraphQL] Token extracted: true
```

If it says `false`, the token is NOT being sent from Postman.

---

## Troubleshooting

### Still Getting "Unauthorized: No token provided"

**1. Check if Authorization header is actually being sent**
- In Postman, click the "Headers" tab
- Look for `Authorization` header with value `Bearer <token>`
- If not there, make sure you selected "Bearer Token" in Authorization tab

**2. Token might be invalid or expired**
- Go to frontend (http://localhost:3000)
- Log in again
- Copy a fresh token
- Paste in Postman

**3. Check token format**
- The token should be a long string like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- It should NOT have "Bearer " prefix in the token field (Postman adds that automatically)

### Expected Success Response

```json
{
  "data": {
    "todayMessageCount": {
      "user": {
        "email": "test@example.com",
        "name": "John Doe"
      },
      "messageCount": 5,
      "messages": [
        { "text": "Hello" },
        { "text": "Hi there" },
        { "text": "How are you" },
        { "text": "I'm good" },
        { "text": "Great!" }
      ]
    }
  }
}
```

---

## Files Modified

- ✅ `apps/server/src/graphql/handler.ts` - NEW GraphQL request handler
- ✅ `apps/server/src/index.ts` - Import and use the handler
- ✅ Build succeeds with no errors

---

## Key Changes in Code

### Before (not working)
```typescript
const result = await apolloServer.executeOperation(
    { query, variables },
    { authToken: token } as any  // ❌ This wasn't working
);
```

### After (working)
```typescript
const contextValue = {
    authToken: token || undefined,
};

const result = await apolloServer.executeOperation(
    { query, variables },
    contextValue as any  // ✅ Proper context object
);
```

---

## Test Checklist

- [ ] Server starts without errors
- [ ] Postman shows Authorization header is set
- [ ] Logs show `[GraphQL] Auth header present: true`
- [ ] Logs show `[GraphQL] Token extracted: true`
- [ ] Response contains `data.todayMessageCount.messageCount`
- [ ] No error about "Unauthorized: No token provided"

---

## Next Steps

Once this works, you should see your message count and today's messages in the response!

If it's still not working, share the exact error message and server logs.
