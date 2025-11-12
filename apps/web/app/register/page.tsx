'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading, error } = useAuth();
  const router = useRouter();
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    try {
      await register(email, password, name);
      router.push('/');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className={styles.authRoot}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authTitle}>Create new account</div>
          <div className={styles.authSub}>Join now — start collaborating</div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {(error || validationError) && (
            <div className={styles.errorBox} role="alert">{error || validationError}</div>
          )}

          <input id="name" name="name" type="text" required className={styles.input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />

          <input id="email" name="email" type="email" required className={styles.input} placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />

          <input id="password" name="password" type="password" required className={styles.input} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <input id="confirmPassword" name="confirmPassword" type="password" required className={styles.input} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

          <button type="submit" disabled={isLoading} className={styles.primary}>{isLoading ? 'Creating account...' : 'Register'}</button>

          <div className={styles.centerLink}><p className={styles.smallText}>Already have an account? <Link href="/login" className="text-indigo-600 font-medium">Sign in</Link></p></div>
        </form>
      </div>
    </div>
  );
}
