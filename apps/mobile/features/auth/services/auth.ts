import * as SecureStorage from 'expo-secure-store';

const TOKEN_KEY = 'athlo_access_token';

export class AuthService {
  static async getToken() {
    try {
      return await SecureStorage.getItemAsync(TOKEN_KEY);
    }
    catch (error) {
      console.log('Error getting token:', error);
    }
  }
  static async saveToken(token: string) {
    try{
      await SecureStorage.setItemAsync(TOKEN_KEY, token);
      console.log('Token saved successfully');
    }
    catch(error){
      console.log('Error saving token:', error);
    }
  }
  static async deleteToken() {
    try {
      await SecureStorage.deleteItemAsync(TOKEN_KEY);
      console.log('Token deleted successfully');
    }
    catch (error) {
      console.log('Error deleting token:', error);
    }
  }
}
