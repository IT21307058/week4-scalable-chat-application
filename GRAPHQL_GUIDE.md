# GraphQL Query Guide - Today Message Count

## Endpoint Details
- **URL**: `http://localhost:8000/graphql`
- **Method**: `POST`
- **Authentication**: Bearer token (JWT from login/register)
- **Content-Type**: `application/json`

---

## Available Query: `todayMessageCount`

Returns the authenticated user's message statistics for today.

### Query Structure
```graphql
query {
  todayMessageCount {
    user {
      id           # User UUID
      email        # User email
      name         # User display name
      createdAt    # Account creation timestamp
    }
    messageCount   # Number of messages sent today
    messages {
      id          # Message UUID
      text        # Message content
      userId      # Sender ID
      createdAt   # Message timestamp
    }
  }
}
```

---

## Usage Examples

### 1. Using curl
```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "{
      todayMessageCount {
        user { email name }
        messageCount
        messages { text createdAt }
      }
    }"
  }'
```

### 2. Using JavaScript Fetch
```javascript
const token = localStorage.getItem('auth_token');

const response = await fetch('http://localhost:8000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    query: `{
      todayMessageCount {
        user { id email name }
        messageCount
        messages { text createdAt }
      }
    }`
  })
});

const data = await response.json();
console.log(`${data.data.todayMessageCount.user.name} sent ${data.data.todayMessageCount.messageCount} messages today`);
```

### 3. Using React Hook (provided)
```typescript
import { useTodayMessageStats } from '../context/useTodayMessageStats';

export function MessageStats() {
  const { fetchStats } = useTodayMessageStats();
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    fetchStats().then(setStats);
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h3>{stats.user.name}'s Today Stats</h3>
      <p>Messages sent: {stats.messageCount}</p>
      {stats.messages.map(msg => (
        <div key={msg.id}>{msg.text}</div>
      ))}
    </div>
  );
}
```

---

## Response Format

### Success Response
```json
{
  "data": {
    "todayMessageCount": {
      "user": {
        "id": "uuid-here",
        "email": "user@example.com",
        "name": "nimal",
        "createdAt": "2025-11-10T08:30:00.000Z"
      },
      "messageCount": 5,
      "messages": [
        {
          "id": "msg-1",
          "text": "Hi everyone",
          "userId": "uuid-here",
          "createdAt": "2025-11-12T15:45:30.000Z"
        },
        {
          "id": "msg-2",
          "text": "How's everyone doing?",
          "userId": "uuid-here",
          "createdAt": "2025-11-12T16:00:00.000Z"
        }
      ]
    }
  }
}
```

### Error Response (Unauthorized)
```json
{
  "errors": [
    {
      "message": "Unauthorized: No token provided"
    }
  ]
}
```

### Error Response (Invalid Token)
```json
{
  "errors": [
    {
      "message": "Unauthorized: Invalid token"
    }
  ]
}
```

---

## Schema Types

```graphql
type User {
  id: String!           # Required
  email: String!        # Required
  name: String          # Optional
  createdAt: String!    # ISO 8601 timestamp
}

type Message {
  id: String!          # Required
  text: String!        # Required (message content)
  userId: String!      # Required (sender ID)
  createdAt: String!   # ISO 8601 timestamp
}

type TodayMessageCountResult {
  user: User!
  messageCount: Int!
  messages: [Message!]!
}

type Query {
  todayMessageCount: TodayMessageCountResult!
}
```

---

## Common Issues & Solutions

### 1. "Unexpected token < in JSON"
**Cause**: Server returned HTML error page instead of JSON  
**Solution**: Check server is running and endpoint is correct

### 2. "Unauthorized: Invalid token"
**Cause**: JWT token expired or malformed  
**Solution**: Log in again to get a fresh token

### 3. "Cannot find module '@apollo/server'"
**Cause**: Dependencies not installed  
**Solution**: Run `npm install` in `apps/server`

### 4. "User not found"
**Cause**: Token references deleted user  
**Solution**: This shouldn't happen; indicates data inconsistency

---

## Testing the Endpoint

### Option 1: Postman
1. Create new POST request
2. URL: `http://localhost:8000/graphql`
3. Go to Headers tab, add:
   - Key: `Authorization`
   - Value: `Bearer <your_jwt_token>`
4. Go to Body → Raw → JSON
5. Paste the GraphQL query

### Option 2: GraphQL Playground (if added later)
Apollo Server can be configured with Apollo Sandbox for interactive querying

### Option 3: Command Line (PowerShell)
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$body = @{
    query = '{
      todayMessageCount {
        user { email name }
        messageCount
      }
    }'
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/graphql" `
  -Method POST `
  -Headers $headers `
  -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## Performance Notes

- Query runs UTC day boundaries (00:00 - 23:59:59 UTC)
- If users are in different timezones, consider adjusting query to use local time
- For large message counts, consider pagination in future enhancement
- Database index on `Message(userId, createdAt)` recommended for performance

---

## Future Enhancements

- [ ] Add variables support: `query($userId: String!) { ... }`
- [ ] Pagination: `messages(limit: 10, offset: 0) { ... }`
- [ ] Time range filtering: `todayMessageCount(startTime: String, endTime: String)`
- [ ] Aggregated stats: `hourlyMessageCounts: [{ hour: Int, count: Int }]`
- [ ] Real-time subscriptions: `subscription { messageAdded { ... } }`
