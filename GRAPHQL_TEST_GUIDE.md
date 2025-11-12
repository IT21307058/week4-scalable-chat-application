# Test GraphQL with correct request format

## Correct Request Format

The `query` field MUST be a string with the actual GraphQL query.

### ✅ CORRECT Example

```json
{
  "query": "{ todayMessageCount { user { email name } messageCount } }"
}
```

### ❌ WRONG - Missing query field
```json
{}
```

### ❌ WRONG - Empty query
```json
{
  "query": ""
}
```

---

## Test Commands

### PowerShell Test (with real token)
```powershell
# Get a valid JWT token first by logging in via the frontend
# Then copy it here
$token = "your_jwt_token_here"

# Method 1: Simple test query
$query = @"
{
  todayMessageCount {
    user {
      email
      name
    }
    messageCount
    messages {
      text
    }
  }
}
"@

$body = @{
    query = $query
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest -Uri "http://localhost:8000/graphql" `
  -Method POST `
  -Headers $headers `
  -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Curl Test
```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "{ todayMessageCount { user { email name } messageCount } }"
  }'
```

---

## Troubleshooting

### Error: "GraphQL operations must contain a non-empty `query`"
**Cause**: Request body doesn't have `query` field or it's empty  
**Solution**: Make sure your request body has `{ "query": "your_graphql_query_here" }`

### Error: "Unauthorized: No token provided"
**Cause**: Missing `Authorization` header  
**Solution**: Add header: `Authorization: Bearer <your_jwt_token>`

### Error: "Unauthorized: Invalid token"
**Cause**: Token is expired or malformed  
**Solution**: Log in again to get a fresh token

---

## Step-by-Step Test

1. **Start the server**
   ```bash
   cd apps/server
   npm run dev
   ```

2. **In another terminal, start frontend**
   ```bash
   cd apps/web
   npm run dev
   ```

3. **Open browser, go to http://localhost:3000**
   - Register a new user
   - Send a few messages
   - Open DevTools → Console → Application → Cookies
   - Copy the `auth_token` value

4. **Test the GraphQL query**
   ```powershell
   # In PowerShell, replace TOKEN with the value from step 3
   $token = "token_from_browser"
   
   # Run the script from above
   ```

5. **Expected output**
   ```json
   {
     "data": {
       "todayMessageCount": {
         "user": {
           "email": "your@email.com",
           "name": "Your Name"
         },
         "messageCount": 3,
         "messages": [
           { "text": "message 1" },
           { "text": "message 2" },
           { "text": "message 3" }
         ]
       }
     }
   }
   ```

---

## Frontend Hook Usage

Once the GraphQL endpoint works, use it in React:

```typescript
import { useTodayMessageStats } from '../context/useTodayMessageStats';
import { useEffect, useState } from 'react';

export function Dashboard() {
  const { fetchStats } = useTodayMessageStats();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats()
      .then(setData)
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>{data.user.name}'s Stats for Today</h2>
      <p>Messages sent: <strong>{data.messageCount}</strong></p>
      <div>
        {data.messages.map((msg, i) => (
          <div key={i}>{msg.text}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## Request Format Rules

**ALWAYS include:**
- ✅ `"query"` field with GraphQL query string
- ✅ `"Authorization"` header with Bearer token (for authenticated queries)
- ✅ `"Content-Type": "application/json"` header

**Optional:**
- `"variables"` field if using GraphQL variables (for future queries)

**Example with variables** (for future use):
```json
{
  "query": "query getStats($userId: String!) { ... }",
  "variables": { "userId": "123" }
}
```
