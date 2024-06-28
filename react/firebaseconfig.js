import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, getDoc } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const cong = initializeApp(firebaseConfig);

export const db = getFirestore(cong);

// export default cong;