# Quick Test Commands

## 1. Start the Application

### Terminal 1 - Backend Server
```bash
cd apps/server
npm run dev
# Server should start on http://localhost:8000
```

### Terminal 2 - Frontend
```bash
cd apps/web
npm run dev
# Frontend should start on http://localhost:3000
```

---

## 2. Test Sender Name Display

1. Open two browser windows (or use private/incognito mode)
2. Both go to http://localhost:3000
3. Register/login with two different users:
   - User 1: `nimal@test.com` / `password123` / Name: "nimal"
   - User 2: `alice@test.com` / `password456` / Name: "alice"
4. Send messages from both users
5. Verify messages appear as: `"nimal send hello message"` format

---

## 3. Test GraphQL Endpoint

### Using PowerShell
```powershell
# First, get your JWT token by logging in. Copy it from localStorage or network tab.

$token = "your_jwt_token_here"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$body = @{
    query = '{
      todayMessageCount {
        user {
          email
          name
        }
        messageCount
        messages {
          text
          createdAt
        }
      }
    }'
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/graphql" `
  -Method POST `
  -Headers $headers `
  -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Using Postman
1. Create new POST request
2. URL: `http://localhost:8000/graphql`
3. Headers tab:
   - Key: `Authorization`
   - Value: `Bearer <your_token>`
   - Key: `Content-Type`
   - Value: `application/json`
4. Body (Raw, JSON):
```json
{
  "query": "{
    todayMessageCount {
      user {
        id
        email
        name
        createdAt
      }
      messageCount
      messages {
        id
        text
        userId
        createdAt
      }
    }
  }"
}
```
5. Click Send

---

## 4. Test from Frontend Code

Add this to a component to fetch today's message stats:

```typescript
import { useTodayMessageStats } from '../context/useTodayMessageStats';
import { useEffect, useState } from 'react';

export function StatsDemo() {
  const { fetchStats } = useTodayMessageStats();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats().then(data => {
      console.log('Today stats:', data);
      setStats(data);
    });
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h2>{stats.user.name}'s Today</h2>
      <p>Messages sent: {stats.messageCount}</p>
      {stats.messages.map(msg => (
        <div key={msg.id}>
          <strong>{new Date(msg.createdAt).toLocaleTimeString()}</strong>
          <p>{msg.text}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 5. Expected Results

### Sender Names (Chat Page)
```
nimal send Hi message
nimal send How are you message
alice send I'm good message
alice send Thanks for asking message
```

### GraphQL Response
```json
{
  "data": {
    "todayMessageCount": {
      "user": {
        "id": "uuid...",
        "email": "nimal@test.com",
        "name": "nimal",
        "createdAt": "2025-11-10T08:30:00.000Z"
      },
      "messageCount": 2,
      "messages": [
        {
          "id": "msg...",
          "text": "Hi",
          "userId": "uuid...",
          "createdAt": "2025-11-12T15:45:30.000Z"
        },
        {
          "id": "msg...",
          "text": "How are you",
          "userId": "uuid...",
          "createdAt": "2025-11-12T16:00:00.000Z"
        }
      ]
    }
  }
}
```

---

## 6. Troubleshooting

### Messages still showing as strings instead of with sender names
- Check frontend console for errors
- Verify SocketProvider is updated with ChatMessage interface
- Restart frontend dev server

### GraphQL endpoint returns "Unauthorized"
- Verify JWT token is correctly copied from localStorage
- Make sure token is not expired (login again if needed)
- Check Authorization header format: `Bearer <token>`

### "Cannot find module @apollo/server"
- Run `npm install` in apps/server
- Delete node_modules and run `npm install` again

### Port 8000 already in use
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill it (replace PID with the number from previous command)
taskkill /PID <PID> /F

# Or use a different port
$env:PORT=8001; npm run dev
```

---

## File Changes Reference

### Backend
- ✅ `apps/server/src/services/socket.ts` - Includes userName in Redis publish
- ✅ `apps/server/src/graphql/schema.ts` - GraphQL type definitions
- ✅ `apps/server/src/graphql/resolvers.ts` - todayMessageCount resolver
- ✅ `apps/server/src/index.ts` - Apollo Server setup and GraphQL endpoint

### Frontend
- ✅ `apps/web/context/SocketProvider.tsx` - ChatMessage interface and parsing
- ✅ `apps/web/app/page.tsx` - Display sender name with message
- ✅ `apps/web/app/api/auth/register/route.ts` - Fixed JSON parse errors
- ✅ `apps/web/app/api/auth/login/route.ts` - Fixed JSON parse errors
- ✅ `apps/web/context/useTodayMessageStats.ts` - GraphQL hook (NEW)

---

## Key Features Tested
- [ ] User registration works without JSON parse errors
- [ ] User login works without JSON parse errors
- [ ] Messages display with sender name: "userName send message message"
- [ ] GraphQL endpoint `/graphql` accepts Bearer token
- [ ] `todayMessageCount` query returns user details and message count
- [ ] Message timestamps are in ISO 8601 format
- [ ] Multiple users can send messages and see each other's names
