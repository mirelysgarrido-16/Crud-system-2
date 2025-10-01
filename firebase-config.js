
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDAjdSCPVO4PbNPoFNOj2SZVp3hTj8c5Ew",
    authDomain: "api-project-a9938.firebaseapp.com",
    projectId: "api-project-a9938",
    storageBucket: "api-project-a9938.firebasestorage.app",
    messagingSenderId: "755717194281",
    appId: "1:755717194281:web:72b78bee8832078a6a1238",
    measurementId: "G-CCEY73LMJK"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const analytics = getAnalytics(app);
  export { app, db, analytics };