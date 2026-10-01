import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'saleiz_waiter_token';
const USER_KEY = 'saleiz_waiter_user';

export const tokenStorage = {
  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.warn('[Storage] Error reading token:', e.message);
      return null;
    }
  },

  async setToken(token) {
    try {
      if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.warn('[Storage] Error saving token:', e.message);
    }
  },

  async getUser() {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[Storage] Error reading user:', e.message);
      return null;
    }
  },

  async setUser(user) {
    try {
      if (user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.warn('[Storage] Error saving user:', e.message);
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (e) {
      console.warn('[Storage] Error clearing auth storage:', e.message);
    }
  }
};

export default tokenStorage;
