import * as SecureStorage from 'expo-secure-store';

const TOKEN_KEY = 'athlo_access_token';

export class AuthService {
  static async getToken() {
    try {
      return await SecureStorage.getItemAsync(TOKEN_KEY);
    }
    catch (error) {
      if (__DEV__) console.warn('Error getting token:', error);
    }
  }
  static async saveToken(token: string) {
    try{
      await SecureStorage.setItemAsync(TOKEN_KEY, token);
    }
    catch(error){
      if (__DEV__) console.warn('Error saving token:', error);
    }
  }
  static async deleteToken() {
    try {
      await SecureStorage.deleteItemAsync(TOKEN_KEY);
    }
    catch (error) {
      if (__DEV__) console.warn('Error deleting token:', error);
    }
  }
}
