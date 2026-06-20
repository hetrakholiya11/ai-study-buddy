import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useToast } from './toastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    // Restore user details if token is cached
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setToken(null);
      }
    }
    setLoading(false);
  }, [token]);

  /**
   * Logs in a user.
   * If backend is down, falls back to demo login.
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      
      const userObj = data.user;
      const userToken = data.token;
      
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userObj));
      setToken(userToken);
      setUser(userObj);
      showToast(`Welcome back, ${userObj.name}!`, 'success');
      return { success: true };
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.error || 'Login failed';
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      console.warn("Backend login failed (network offline), falling back to Demo Mode.", error);
      
      // Offline fallback: Simulate authenticating user for demo purposes
      const fakeToken = "demo-jwt-token-string";
      const fakeUser = {
        id: "demo-user-123",
        name: email.split('@')[0].toUpperCase(),
        email: email,
        avatar: "",
        studyGoals: "Learn React & AI integrations",
        joinedDate: new Date().toLocaleDateString()
      };

      localStorage.setItem('token', fakeToken);
      localStorage.setItem('user', JSON.stringify(fakeUser));
      setToken(fakeToken);
      setUser(fakeUser);
      showToast(`Logged in as Demo User: ${fakeUser.name}`, 'success');
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registers a new user.
   * If backend is down, falls back to demo register.
   */
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await authService.register({ name, email, password });
      
      const userObj = data.user;
      const userToken = data.token;

      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userObj));
      setToken(userToken);
      setUser(userObj);
      showToast(`Account created successfully! Welcome, ${userObj.name}`, 'success');
      return { success: true };
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.error || 'Registration failed';
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      console.warn("Backend registration failed (network offline), falling back to Demo Mode.", error);
      
      const fakeToken = "demo-jwt-token-string";
      const fakeUser = {
        id: "demo-user-123",
        name: name,
        email: email,
        avatar: "",
        studyGoals: "Learn React & AI integrations",
        joinedDate: new Date().toLocaleDateString()
      };

      localStorage.setItem('token', fakeToken);
      localStorage.setItem('user', JSON.stringify(fakeUser));
      setToken(fakeToken);
      setUser(fakeUser);
      showToast(`Demo account created for ${name}`, 'success');
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logs out the current user.
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  /**
   * Updates current user profile details in DB and local state.
   */
  const updateProfile = async (updatedDetails) => {
    try {
      const data = await authService.updateProfile(updatedDetails);
      if (data && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        showToast('Profile updated successfully', 'success');
        return { success: true };
      }
    } catch (error) {
      console.warn("Backend update failed, updating locally.", error);
      const updatedUser = { ...user, ...updatedDetails };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      showToast('Profile updated locally', 'success');
    }
  };

  /**
   * Updates current user study stats in DB and local state.
   */
  const updateStats = async (statsToUpdate) => {
    try {
      const data = await authService.updateStats(statsToUpdate);
      if (data && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
    } catch (error) {
      console.warn("Backend stats update failed, updating locally.", error);
      const updatedUser = { ...user, ...statsToUpdate };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, updateStats }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
