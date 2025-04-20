// auth.js - Firebase 인증 기능 구현
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Firebase 앱에서 인증 및 DB 인스턴스 가져오기
let auth, db;

// 초기화 함수
export function initializeFirebaseAuth(app) {
  auth = getAuth(app);
  db = getFirestore(app);
  return auth;
}

// 인증 상태 변경 감지 함수
export function setupAuthStateObserver(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('Firebase 인증: 로그인 상태', user);
      const userInfo = {
        id: user.uid,
        nickname: user.displayName || '사용자',
        profileImage: user.photoURL || '',
        email: user.email || '',
        provider: user.providerData[0]?.providerId || 'firebase',
        emailVerified: user.emailVerified,
        loginTime: new Date().toISOString()
      };
      callback(userInfo);
    } else {
      console.log('Firebase 인증: 로그아웃 상태');
      callback(null);
    }
  });
}

// 이메일/비밀번호 로그인
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('로그인 성공:', userCredential.user);
    
    // 로그인 시간 업데이트
    await updateUserLastLogin(userCredential.user.uid);
    
    return userCredential.user;
  } catch (error) {
    console.error('로그인 에러:', error);
    
    // 사용자 친화적인 오류 메시지 반환
    switch (error.code) {
      case 'auth/invalid-email':
        throw new Error('유효하지 않은 이메일 형식입니다.');
      case 'auth/user-disabled':
        throw new Error('해당 계정은 비활성화되었습니다. 관리자에게 문의하세요.');
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      default:
        throw new Error('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }
}

// 구글 로그인
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'  // 항상 계정 선택 화면 표시
    });
    
    const result = await signInWithPopup(auth, provider);
    console.log('구글 로그인 성공:', result.user);
    
    // 사용자 정보 Firestore에 저장
    await saveUserToFirestore(result.user);
    
    return result.user;
  } catch (error) {
    console.error('구글 로그인 에러:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('로그인 창이 닫혔습니다. 다시 시도해주세요.');
    } else {
      throw new Error('구글 로그인 중 오류가 발생했습니다.');
    }
  }
}

// 회원가입
export async function registerWithEmail(name, email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 사용자 정보 업데이트 (이름 추가)
    await updateProfile(user, {
      displayName: name
    });
    
    // 이메일 인증 메일 발송
    await sendEmailVerification(user);
    
    // 사용자 정보 Firestore에 저장
    await saveUserToFirestore(user);
    
    console.log('회원가입 성공:', user);
    return user;
  } catch (error) {
    console.error('회원가입 에러:', error);
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('이미 사용 중인 이메일입니다.');
      case 'auth/invalid-email':
        throw new Error('유효하지 않은 이메일 형식입니다.');
      case 'auth/weak-password':
        throw new Error('비밀번호가 너무 약합니다. 6자 이상 입력해주세요.');
      default:
        throw new Error('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }
}

// 로그아웃
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log('로그아웃 성공');
    
    // 카카오 로그아웃 (카카오로 로그인한 경우)
    if (typeof Kakao !== 'undefined' && Kakao.Auth.getAccessToken()) {
      Kakao.Auth.logout(() => {
        console.log('카카오 로그아웃 성공');
      });
    }
    
    return true;
  } catch (error) {
    console.error('로그아웃 에러:', error);
    throw new Error('로그아웃 중 오류가 발생했습니다.');
  }
}

// 비밀번호 재설정 이메일 보내기
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('비밀번호 재설정 이메일 발송됨');
    return true;
  } catch (error) {
    console.error('비밀번호 재설정 에러:', error);
    
    switch (error.code) {
      case 'auth/invalid-email':
        throw new Error('유효하지 않은 이메일 형식입니다.');
      case 'auth/user-not-found':
        throw new Error('등록되지 않은 이메일입니다.');
      default:
        throw new Error('비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.');
    }
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
      emailVerified: user.emailVerified,
      provider: user.providerData[0]?.providerId || 'firebase',
      lastLogin: serverTimestamp()
    };
    
    if (!userSnap.exists()) {
      // 새 사용자
      userData.createdAt = serverTimestamp();
      userData.profileCompleted = false;  // 추가 정보 입력 여부
    }
    
    await setDoc(userRef, userData, { merge: true });
    console.log('사용자 정보 저장됨');
    return true;
  } catch (error) {
    console.error('사용자 정보 저장 에러:', error);
    return false;
  }
}

// 사용자 로그인 시간 업데이트
async function updateUserLastLogin(userId) {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      lastLogin: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('로그인 시간 업데이트 오류:', error);
    return false;
  }
}

// 이메일 인증 상태 확인
export async function checkEmailVerification() {
  try {
    // 현재 사용자 정보 새로고침
    await auth.currentUser?.reload();
    return auth.currentUser?.emailVerified || false;
  } catch (error) {
    console.error('이메일 인증 상태 확인 오류:', error);
    return false;
  }
}

// 이메일 인증 메일 재발송
export async function resendEmailVerification() {
  try {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return true;
    }
    return false;
  } catch (error) {
    console.error('이메일 인증 메일 재발송 오류:', error);
    
    if (error.code === 'auth/too-many-requests') {
      throw new Error('너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.');
    }
    
    throw new Error('인증 메일 발송 중 오류가 발생했습니다.');
  }
}

// 현재 로그인한 사용자 가져오기
export function getCurrentUser() {
  return auth.currentUser;
}
