import React, { useState } from 'react';
import api from '../services/api';

export function Login({ onLogin, onError }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await api.login({ email, password });
      } else {
        await api.signup({ email, password, name });
      }
      if (onLogin) onLogin();
    } catch (err) {
      if (onError) onError(err.message || 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h3>{mode === 'login' ? 'Sign in' : 'Create account'}</h3>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        {mode === 'signup' && <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />}
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>{loading ? 'Please wait...' : (mode === 'login' ? 'Sign in' : 'Create')}</button>
          <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="btn-secondary" style={{ flex: 1 }}>
            {mode === 'login' ? 'Create account' : 'Have an account?'}
          </button>
        </div>
      </form>
    </div>
  );
}
