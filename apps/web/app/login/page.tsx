 'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className={styles.authRoot}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authTitle}>Sign in to your account</div>
          <div className={styles.authSub}>Enter your credentials to continue</div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.errorBox} role="alert">{error}</div>
          )}

          <input
            id="email"
            name="email"
            type="email"
            required
            className={styles.input}
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            id="password"
            name="password"
            type="password"
            required
            className={styles.input}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={isLoading} className={styles.primary}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className={styles.centerLink}>
            <p className={styles.smallText}>
              Don't have an account?{' '}
              <Link href="/register" className="text-indigo-600 font-medium">Register</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
