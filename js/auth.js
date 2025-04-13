// auth.js - Firebase 인증 기능 구현
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Firebase 앱 인스턴스 참조
import { app } from './firebase-config.js';

// 인증 및 DB 인스턴스 초기화
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// 이메일/비밀번호 로그인
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('로그인 성공:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('로그인 에러:', error);
    throw error;
  }
}

// 구글 로그인
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('구글 로그인 성공:', result.user);
    
    // 사용자 정보 Firestore에 저장
    await saveUserToFirestore(result.user);
    
    return result.user;
  } catch (error) {
    console.error('구글 로그인 에러:', error);
    throw error;
  }
}

// 회원가입
export async function registerWithEmail(name, email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // 사용자 정보 업데이트 (이름 추가)
    await updateProfile(userCredential.user, {
      displayName: name
    });
    
    // 사용자 정보 Firestore에 저장
    await saveUserToFirestore(userCredential.user);
    
    console.log('회원가입 성공:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('회원가입 에러:', error);
    throw error;
  }
}

// 로그아웃
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log('로그아웃 성공');
  } catch (error) {
    console.error('로그아웃 에러:', error);
    throw error;
  }
}

// 비밀번호 재설정 이메일 보내기
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('비밀번호 재설정 이메일 발송됨');
  } catch (error) {
    console.error('비밀번호 재설정 에러:', error);
    throw error;
  }
}

// 사용자 정보를 Firestore에 저장
async function saveUserToFirestore(user) {
  if (!user) return;
  
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    const userData = {
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      lastLogin: serverTimestamp()
    };
    
    if (!userSnap.exists()) {
      // 새 사용자
      userData.createdAt = serverTimestamp();
    }
    
    await setDoc(userRef, userData, { merge: true });
    console.log('사용자 정보 저장됨');
  } catch (error) {
    console.error('사용자 정보 저장 에러:', error);
  }
}
