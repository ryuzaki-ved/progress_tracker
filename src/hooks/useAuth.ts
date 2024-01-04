import { useState } from 'react';

export const useAuth = () => {
  // Always return a dummy user so the app is always 'signed in'
  const [user] = useState({ id: 1, email: 'local@user.com' });
  const [loading] = useState(false);

  return {
    user,
    loading,
    signIn: async () => ({ data: null, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signOut: async () => ({ data: null, error: null }),
  };
};