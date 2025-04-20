// main.js - 메인 스크립트 파일

// auth-handler.js에서 함수 가져오기
import { 
  initializeKakao, 
  handleKakaoLogin, 
  handleLogout, 
  checkLoginStatus, 
  completeLogin 
} from './auth-handler.js';

// ui.js에서 함수 가져오기
import { 
  updateUserProfileUI, 
  updateUserProfileUIForLogout, 
  setupModals, 
  setupMobileMenu,
  setupProfileDropdown,
  initializeUI 
} from './ui.js';

// Firebase 설정 파일에서 가져오기 (Firebase 사용 시)
// import { app } from './firebase-config.js';
// import { getAuth } from 'firebase/auth';

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
  // UI 초기화
  initializeUI();
  
  // 카카오 SDK 초기화
  initializeKakao();
  
  // 인증 관련 이벤트 리스너 설정
  setupAuthEventListeners();
  
  // 로그인 상태 확인
  const userInfo = checkLoginStatus();
  if (userInfo) {
    updateUserProfileUI(userInfo);
  }
  
  console.log('웹사이트가 초기화되었습니다.');
});

// 인증 관련 이벤트 리스너 설정
function setupAuthEventListeners() {
  // 카카오 로그인 버튼
  const kakaoLoginBtn = document.getElementById('kakaoLoginBtn');
  const kakaoSignupBtn = document.getElementById('kakaoSignupBtn');
  
  if (kakaoLoginBtn) {
    kakaoLoginBtn.addEventListener('click', async function() {
      try {
        const userInfo = await handleKakaoLogin();
        if (userInfo) {
          completeLogin(userInfo);
          updateUserProfileUI(userInfo);
          alert(`${userInfo.nickname}님, 환영합니다!`);
          
          // 로그인 모달 닫기
          const loginModal = document.getElementById('loginModal');
          if (loginModal) loginModal.classList.add('hidden');
        }
      } catch (error) {
        console.error('카카오 로그인 처리 오류:', error);
        alert(typeof error === 'string' ? error : '로그인 중 오류가 발생했습니다.');
      }
    });
  }
  
  // 카카오 회원가입 버튼 (로그인 버튼과 동일 기능)
  if (kakaoSignupBtn && kakaoLoginBtn) {
    kakaoSignupBtn.addEventListener('click', function() {
      kakaoLoginBtn.click();
    });
  }
  
  // 구글 로그인 버튼
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleSignupBtn = document.getElementById('googleSignupBtn');
  
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function() {
      alert('구글 로그인은 아직 준비 중입니다.');
    });
  }
  
  if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', function() {
      alert('구글 계정으로 회원가입은 아직 준비 중입니다.');
    });
  }
  
  // 이메일 로그인 버튼
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.addEventListener('click', function() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        alert('이메일과 비밀번호를 모두 입력해주세요.');
        return;
      }
      
      // 간단한 테스트 로그인 (실제로는 Firebase 인증 사용)
      if (email === 'test@example.com' && password === 'password') {
        const userInfo = {
          id: 'test123',
          nickname: '테스트 사용자',
          email: email,
          profileImage: '',
          provider: 'email'
        };
        
        completeLogin(userInfo);
        updateUserProfileUI(userInfo);
        
        // 로그인 모달 닫기
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.classList.add('hidden');
        
        alert(`${userInfo.nickname}님, 환영합니다!`);
      } else {
        alert('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    });
  }
  
  // 회원가입 버튼
  const signupButton = document.getElementById('signupButton');
  if (signupButton) {
    signupButton.addEventListener('click', function() {
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const passwordConfirm = document.getElementById('signup-password-confirm').value;
      const termsChecked = document.getElementById('terms').checked;
      
      if (!name || !email || !password || !passwordConfirm) {
        alert('모든 필수 정보를 입력해주세요.');
        return;
      }
      
      if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }
      
      if (!termsChecked) {
        alert('이용약관에 동의해주세요.');
        return;
      }
      
      // 간단한 테스트 회원가입 (실제로는 Firebase 인증 사용)
      alert(`${name}님, 회원가입이 완료되었습니다. 로그인해주세요.`);
      
      // 로그인 폼으로 전환
      const loginForm = document.getElementById('loginForm');
      const signupForm = document.getElementById('signupForm');
      const modalTitle = document.getElementById('modal-title');
      
      if (loginForm && signupForm && modalTitle) {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        modalTitle.textContent = '로그인';
      }
    });
  }
  
  // 비밀번호 재설정 버튼
  const resetPasswordButton = document.getElementById('resetPasswordButton');
  if (resetPasswordButton) {
    resetPasswordButton.addEventListener('click', function() {
      const email = document.getElementById('reset-email').value;
      
      if (!email) {
        alert('이메일을 입력해주세요.');
        return;
      }
      
      // 간단한 테스트 비밀번호 재설정 (실제로는 Firebase 인증 사용)
      alert(`${email}로 비밀번호 재설정 링크가 전송되었습니다.`);
      
      // 로그인 폼으로 전환
      const loginForm = document.getElementById('loginForm');
      const forgotPasswordForm = document.getElementById('forgotPasswordForm');
      const modalTitle = document.getElementById('modal-title');
      
      if (loginForm && forgotPasswordForm && modalTitle) {
        loginForm.classList.remove('hidden');
        forgotPasswordForm.classList.add('hidden');
        modalTitle.textContent = '로그인';
      }
    });
  }
  
  // 로그아웃 버튼
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      try {
        await handleLogout();
        updateUserProfileUIForLogout();
        
        // 드롭다운 메뉴 닫기
        const profileDropdownMenu = document.getElementById('profileDropdownMenu');
        if (profileDropdownMenu) {
          profileDropdownMenu.classList.add('hidden');
        }
        
        alert('로그아웃 되었습니다.');
      } catch (error) {
        console.error('로그아웃 오류:', error);
      }
    });
  }
  
  // 모바일 로그아웃 버튼
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      try {
        await handleLogout();
        updateUserProfileUIForLogout();
        
        // 모바일 메뉴 닫기
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
          mobileMenu.classList.add('hidden');
        }
        
        alert('로그아웃 되었습니다.');
      } catch (error) {
        console.error('로그아웃 오류:', error);
      }
    });
  }
}
