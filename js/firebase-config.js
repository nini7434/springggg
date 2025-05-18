// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

// Firebase 구성 정보
const firebaseConfig = {
  apiKey: "AIzaSyCXWLanNJmOcVG43-VPHxwEhUOruPbYM3A",
  authDomain: "spring-again-5beef.firebaseapp.com",
  projectId: "spring-again-5beef",
  storageBucket: "spring-again-5beef.appspot.com",
  messagingSenderId: "230998888543",
  appId: "1:230998888543:web:838ddfcde96b275516cbea",
  measurementId: "G-Q79MWQPK8J"
};

// Firebase 초기화
export const app = initializeApp(firebaseConfig);
