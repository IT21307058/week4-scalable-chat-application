'use client'
import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketProvider';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTodayMessageStats, TodayMessageStats } from '../context/useTodayMessageStats';
import classes from './page.module.css';

export default function Page() {
  const { sendMessage, messages } = useSocket();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { fetchStats } = useTodayMessageStats();
  const [message, setMessage] = useState("");
  const [todayStats, setTodayStats] = useState<TodayMessageStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const loadTodayStats = async () => {
    if (!user) return;
    setIsLoadingStats(true);
    try {
      const stats = await fetchStats();
      console.log('Stats:', stats);
      setTodayStats(stats);
    } catch (error) {
      console.error('Failed to load today stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTodayStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Chat</h1>
          <p className="mb-8">Please sign in to continue</p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/login')}
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register')}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('Today Stats:', todayStats);

  return (
    <div className={`app-root ${classes.chatContainer}`}>
      <header className="chat-header">
        <div className="chat-title">Chat Application</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {todayStats && (
            <div style={{ 
              background: 'rgba(99, 102, 241, 0.15)', 
              padding: '8px 16px', 
              borderRadius: 8,
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>
                Today's Messages: <strong style={{ color: '#a5b4fc' }}>{ todayStats ? todayStats.messageCount : 0}</strong>
              </span>
              <button
                onClick={loadTodayStats}
                disabled={isLoadingStats}
                style={{ 
                  background: 'rgba(99, 102, 241, 0.3)', 
                  color: 'white', 
                  padding: '4px 8px', 
                  borderRadius: 4, 
                  border: 'none',
                  cursor: isLoadingStats ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  opacity: isLoadingStats ? 0.6 : 1
                }}
                title="Refresh message count"
              >
                {isLoadingStats ? '...' : '↻'}
              </button>
            </div>
          )}
          <span style={{ color: 'rgba(255,255,255,0.95)' }}>Welcome, {user.name || user.email}</span>
          <button
            onClick={handleLogout}
            style={{ background: '#ef4444', color: 'white', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className={classes.messages + ' messages-wrap'}>
        {messages.length === 0 ? (
          <div style={{ color: 'var(--muted)' }}>No messages yet. Start chatting!</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={classes.messageItem + ' msg-item'}>
              <div className={classes.messageBubble + ' msg-bubble'}>
                {/* Render as: "<userName> send <message> message" */}
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 6 }}>
                  {`${msg.userName} send ${msg.message} message`}
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      <div className="chat-input-area chat-input-area">
        <div className="chat-input-row chat-input-row">
          <input
            type="text"
            className={classes.chatInput + ' chat-input-row-input'}
            onChange={(e) => setMessage(e.target.value)}
            value={message}
            placeholder="Type your message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage(message);
                setMessage('');
              }
            }}
          />
          <button
            className={classes.button + ' send-button'}
            onClick={(e) => {
              e.preventDefault();
              sendMessage(message);
              setMessage('');
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}