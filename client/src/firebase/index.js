// src/firebase.js
import firebase from "firebase";
const config = {
  apiKey: "AIzaSyBSJwBNLkbiZFq6mXFlVFEh6HSqAEhwiCE",
  authDomain: "coronavirus-b7bca.firebaseapp.com",
  databaseURL: "https://coronavirus-b7bca.firebaseio.com",
  projectId: "coronavirus-b7bca",
  storageBucket: "coronavirus-b7bca.appspot.com",
  messagingSenderId: "810009636586",
  appId: "1:810009636586:web:50365957872a72006cf193",
  measurementId: "G-FEJ2Y6PJVW",
};
firebase.initializeApp(config);
firebase.analytics();
export default firebase;
