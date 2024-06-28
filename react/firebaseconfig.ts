

// firebaseconfig.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAz_6fd-Oyh9gce0kV_bP8_YFFNzovcn3U",
    authDomain: "skye-7aff5.firebaseapp.com",
    databaseURL: "https://skye-7aff5.firebaseio.com",
    projectId: "skye-7aff5",
    storageBucket: "skye-7aff5.appspot.com",
    messagingSenderId: "873721678209",
    appId: "1:873721678209:web:0616525d64830ddf71c080",
    measurementId: "G-KVTT2TGC0E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
