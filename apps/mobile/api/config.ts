import Constants from 'expo-constants';

const localhost = Constants.expoConfig?.hostUri?.split(':').shift();

export const API_URL = __DEV__
  ? `http://${localhost}:3000`
  : 'https://your-app-api.railway.app';