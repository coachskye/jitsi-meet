// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxgUpJJ9DeeUwR1XoXd_OCKBVXkUDPggA",
  authDomain: "skye-e49a2.firebaseapp.com",
  databaseURL: "https://skye-e49a2-default-rtdb.firebaseio.com",
  projectId: "skye-e49a2",
  storageBucket: "skye-e49a2.appspot.com",
  messagingSenderId: "732233128466",
  appId: "1:732233128466:web:8c03078ac23c3d15be16cb"
};

// Initialize Firebase
const cong = initializeApp(firebaseConfig);

export default cong;