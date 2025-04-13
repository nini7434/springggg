// auth-handler.js - 인증 이벤트 핸들러

import { 
  onAuthStateChanged, 
  getAuth 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import { app } from './firebase-config.js';
import { 
  loginWithEmail, 
  loginWithGoogle, 
  registerWithEmail, 
  resetPassword, 
  logoutUser 
} from './auth.js';

const auth = getAuth(app);

// 에러 처리 함수
export function handleAuthError(error) {
  let message = '오류가 발생했습니다. 다시 시도해주세요.';
  
  switch (error.code) {
    case 'auth/invalid-email':
      message = '유효하지 않은 이메일 형식입니다.';
      break;
    case 'auth/user-disabled':
      message = '계정이 비활성화되었습니다.';
      break;
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      message = '이메일 또는 비밀번호가 올바르지 않습니다.';
      break;
    case 'auth/email-already-in-use':
      message = '이미 가입된 이메일입니다.';
      break;
    case 'auth/weak-password':
      message = '비밀번호는 최소 6자 이상이어야 합니다.';
      break;
    case 'auth/too-many-requests':
      message = '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.';
      break;
    case 'auth/popup-closed-by-user':
      message = '팝업이 사용자에 의해 닫혔습니다. 다시 시도해주세요.';
      break;
    case 'auth/popup-blocked':
      message = '팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
      break;
    case 'auth/cancelled-popup-request':
      message = '이미 진행 중인 팝업 요청이 있습니다.';
      break;
  }
  
  alert(message);
  console.error('Auth Error:', error.code, error.message);
}

// 인증 상태 관찰자 설정
export function setupAuthStateObserver() {
  onAuthStateChanged(auth, (user) => {
    updateUIForAuthState(user);
  });
}

// 인증 상태에 따른 UI 업데이트
function updateUIForAuthState(user) {
  // 헤더 요소
  const userProfileDropdown = document.getElementById('userProfileDropdown');
  const headerLoginBtn = document.getElementById('headerLoginBtn');
  const userDisplayName = document.getElementById('userDisplayName');
  const userAvatarImg = document.getElementById('userAvatarImg');
  
  // 모바일 메뉴 요소
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const mobileUserProfile = document.getElementById('mobileUserProfile');
  const mobileUserDisplayName = document.getElementById('mobileUserDisplayName');
  const mobileUserAvatarImg = document.getElementById('mobileUserAvatarImg');

  if (user) {
    // 로그인 상태
    console.log("User is signed in:", user.displayName);
    
    // 데스크톱 UI 업데이트
    if (headerLoginBtn) headerLoginBtn.classList.add('hidden');
    if (userProfileDropdown) userProfileDropdown.classList.remove('hidden');
    
    // 모바일 UI 업데이트
    if (mobileLoginBtn) mobileLoginBtn.classList.add('hidden');
    if (mobileUserProfile) mobileUserProfile.classList.remove('hidden');
    
    // 사용자 정보 표시 (데스크톱)
    if (userDisplayName) userDisplayName.textContent = user.displayName || '사용자';
    if (userAvatarImg) {
      if (user.photoURL) {
        userAvatarImg.src = user.photoURL;
      } else {
        const initial = (user.displayName || '사용자')[0].toUpperCase();
        userAvatarImg.src = `https://via.placeholder.com/36/EC4899/ffffff?text=${initial}`;
      }
    }
    
    // 사용자 정보 표시 (모바일)
    if (mobileUserDisplayName) mobileUserDisplayName.textContent = user.displayName || '사용자';
    if (mobileUserAvatarImg) {
      if (user.photoURL) {
        mobileUserAvatarImg.src = user.photoURL;
      } else {
        const initial = (user.displayName || '사용자')[0].toUpperCase();
        mobileUserAvatarImg.src = `https://via.placeholder.com/36/EC4899/ffffff?text=${initial}`;
      }
    }
  } else {
    // 로그아웃 상태
    console.log("User is signed out");
    
    // 데스크톱 UI 업데이트
    if (headerLoginBtn) headerLoginBtn.classList.remove('hidden');
    if (userProfileDropdown) userProfileDropdown.classList.add('hidden');
    
    // 모바일 UI 업데이트
    if (mobileLoginBtn) mobileLoginBtn.classList.remove('hidden');
    if (mobileUserProfile) mobileUserProfile.classList.add('hidden');
    
    // 로그인 모달 관련 상태 초기화
    const loginModal = document.getElementById('loginModal');
    if (loginModal) loginModal.classList.add('hidden');
  }
}

// 이벤트 리스너 설정
export function setupAuthEventListeners() {
  // 이메일/비밀번호 로그인
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.addEventListener('click', async function() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        alert('이메일과 비밀번호를 모두 입력해주세요');
        return;
      }
      
      try {
        await loginWithEmail(email, password);
        document.getElementById('loginModal').classList.add('hidden');
      } catch (error) {
        handleAuthError(error);
      }
    });
  }
  
  // 구글 로그인
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async function() {
      try {
        console.log('구글 로그인 시도 중...');
        await loginWithGoogle();
        document.getElementById('loginModal').classList.add('hidden');
      } catch (error) {
        handleAuthError(error);
      }
    });
  }
  
  // 구글 회원가입
  const googleSignupBtn = document.getElementById('googleSignupBtn');
  if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', async function() {
      try {
        await loginWithGoogle();
        document.getElementById('loginModal').classList.add('hidden');
      } catch (error) {
        handleAuthError(error);
      }
    });
  }
  
  // 이메일/비밀번호 회원가입
  const signupButton = document.getElementById('signupButton');
  if (signupButton) {
    signupButton.addEventListener('click', async function() {
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const passwordConfirm = document.getElementById('signup-password-confirm').value;
      const terms = document.getElementById('terms').checked;
      
      if (!name || !email || !password) {
        alert('모든 필수 정보를 입력해주세요');
        return;
      }
      
      if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다');
        return;
      }
      
      if (!terms) {
        alert('이용약관에 동의해주세요');
        return;
      }
      
      try {
        await registerWithEmail(name, email, password);
        document.getElementById('loginModal').classList.add('hidden');
      } catch (error) {
        handleAuthError(error);
      }
    });
  }
  
  // 비밀번호 재설정
  const resetPasswordButton = document.getElementById('resetPasswordButton');
  if (resetPasswordButton) {
    resetPasswordButton.addEventListener('click', async function() {
      const email = document.getElementById('reset-email').value;
      
      if (!email) {
        alert('이메일을 입력해주세요');
        return;
      }
      
      try {
        await resetPassword(email);
        alert('비밀번호 재설정 이메일이 발송되었습니다');
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('forgotPasswordForm').classList.add('hidden');
        document.getElementById('modal-title').textContent = '로그인';
      } catch (error) {
        handleAuthError(error);
      }
    });
  }
  
  // 로그아웃 (데스크톱)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      try {
        await logoutUser();
        document.getElementById('profileDropdownMenu').classList.add('hidden');
      } catch (error) {
        console.error('로그아웃 에러:', error);
      }
    });
  }
  
  // 로그아웃 (모바일)
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      try {
        await logoutUser();
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) mobileMenu.classList.add('hidden');
      } catch (error) {
        console.error('로그아웃 에러:', error);
      }
    });
  }
  
  // 프로필 드롭다운 토글
  const userProfileBtn = document.getElementById('userProfileBtn');
  const profileDropdownMenu = document.getElementById('profileDropdownMenu');
  
  if (userProfileBtn && profileDropdownMenu) {
    userProfileBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      profileDropdownMenu.classList.toggle('hidden');
    });
    
    // 드롭다운 외부 클릭 시 닫기
    document.addEventListener('click', function(e) {
      if (profileDropdownMenu && !userProfileBtn.contains(e.target) && !profileDropdownMenu.contains(e.target)) {
        profileDropdownMenu.classList.add('hidden');
      }
    });
  }
}
