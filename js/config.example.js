// js/config.js - THIS IS THE ACTUAL FILE (not template)
window.API_BASE_URL = 'https://dummyjson.com';

window.CONFIG = {
    FIREBASE: {
        apiKey: "FIREBASE_API_KEY",
        authDomain: "FIREBASE_AUTH_DOMAIN",
        projectId: "FIREBASE_PROJECT_ID",
        storageBucket: "FIREBASE_STORAGE_BUCKET",
        messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID",
        appId: "FIREBASE_APP_ID"
    }
};

console.log('✅ Firebase config loaded from config.js');
console.log('API Key:', window.CONFIG.FIREBASE.apiKey.substring(0, 10) + '...');