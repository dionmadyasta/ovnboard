import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // Login sukses!
      onLogin(data.user);
    }
  };

  return (
    <div className="login-container">
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="login-header">
          <div className="login-logo">
            <img src="/ovn_logo.png" alt="OVN Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1>Welcome to OVN Boards</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div style={{ color: 'var(--error)', fontSize: '13px', textAlign: 'center', backgroundColor: 'rgba(180, 19, 64, 0.05)', padding: '10px', borderRadius: '8px' }}>{error}</div>}
          
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
