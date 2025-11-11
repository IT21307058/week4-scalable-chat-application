'use client'
import { useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import classes from './page.module.css';

export default function Page() {
  const { sendMessage, messages } = useSocket();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("");

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

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

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chat Application</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {user.name || user.email}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold mb-4">Messages</h2>
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet. Start chatting!</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="bg-white p-3 rounded shadow">
                {msg}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
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