// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyComahXKIFUXlhy9wIkuiJkov4o0sLk_2s",
  authDomain: "studio-1368577590-1354d.firebaseapp.com",
  databaseURL: "https://studio-1368577590-1354d-default-rtdb.firebaseio.com",
  projectId: "studio-1368577590-1354d",
  storageBucket: "studio-1368577590-1354d.firebasestorage.app",
  messagingSenderId: "194006907295",
  appId: "1:194006907295:web:655b7722dc2019cddce5aa"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export { firebaseConfig };
