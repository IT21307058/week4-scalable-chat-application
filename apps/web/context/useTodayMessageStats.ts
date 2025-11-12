import { useAuth } from './AuthContext';

export interface TodayMessageStats {
  user: {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
  };
  messageCount: number;
  messages: Array<{
    id: string;
    text: string;
    userId: string;
    createdAt: string;
  }>;
}

export const useTodayMessageStats = () => {
  const { user } = useAuth();

  const fetchStats = async (): Promise<TodayMessageStats | null> => {
    if (!user) {
      console.warn('No authenticated user');
      return null;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      console.warn('No auth token found');
      return null;
    }

    try {
      const query = `
        query {
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
        }
      `;

      const response = await fetch('http://localhost:8000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      console.log('Response:', response);

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      console.log('Result:', result.body.singleResult.data.todayMessageCount.messageCount);
      return  result.body.singleResult.data.todayMessageCount || null;
    } catch (err) {
      console.error('Failed to fetch today message stats:', err);
      return null;
    }
  };

  return { fetchStats };
};
