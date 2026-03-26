import Constants from 'expo-constants';

const PRODUCTION_API_URL = 'https://athlo-api.onrender.com';

const getBaseUrl = () => {
    if (!__DEV__) {
        return PRODUCTION_API_URL;
    }

    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0];

    if (!localhost) {
        return 'http://localhost:4000';
    }

    return `http://${localhost}:4000`;
};

export const API_URL = getBaseUrl();
