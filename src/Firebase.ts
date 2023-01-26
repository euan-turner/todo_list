// Import the needed functions from required SDKs
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCtHFn5V1OEX1atIEIE9Y3e4X7ON4VVlP4",
    authDomain: "todo-list-6fd61.firebaseapp.com",
    projectId: "todo-list-6fd61",
    storageBucket: "todo-list-6fd61.appspot.com",
    messagingSenderId: "1058080460884",
    appId: "1:1058080460884:web:1a67a9582b3e99f63f5dc1",
    measurementId: "G-S9EP3VJQ9E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);