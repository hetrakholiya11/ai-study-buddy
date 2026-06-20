import API from './api';

/**
 * Authentication API Service client
 */
export const authService = {
  /**
   * Registers a new user.
   * @param {Object} userData - { name, email, password }
   * @returns {Promise<Object>} Response data containing user info and token
   */
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Logs in an existing user.
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} Response data containing user info and token
   */
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Updates the user profile details.
   * @param {Object} profileData - { name, studyGoals }
   * @returns {Promise<Object>} Response containing updated user
   */
  updateProfile: async (profileData) => {
    const response = await API.put('/auth/profile', profileData);
    return response.data;
  },

  /**
   * Updates the user study statistics.
   * @param {Object} statsData - { quizzesCompleted, studyStreak, summariesGenerated, studyMinutes }
   * @returns {Promise<Object>} Response containing updated user
   */
  updateStats: async (statsData) => {
    const response = await API.put('/auth/stats', statsData);
    return response.data;
  },
};
