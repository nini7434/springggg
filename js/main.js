// main.js - 메인 스크립트 파일

// Firebase SDK 가져오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// auth.js에서 함수 가져오기
import { 
  initializeFirebaseAuth, 
  setupAuthStateObserver, 
  loginWithEmail, 
  loginWithGoogle, 
  registerWithEmail, 
  logoutUser, 
  resetPassword,
  checkEmailVerification,
  resendEmailVerification
} from './auth.js';

// ui.js에서 함수 가져오기
import { 
  updateUserProfileUI, 
  updateUserProfileUIForLogout, 
  setupModals, 
  setupMobileMenu,
  setupProfileDropdown,
  initializeUI 
} from './ui.js';

// 카카오 인증 함수
import { 
  initializeKakao, 
  handleKakaoLogin, 
  handleKakaoLogout 
} from './auth-handler.js';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyCXWLanNJmOcVG43-VPHxwEhUOruPbYM3A",
  authDomain: "spring-again-5beef.firebaseapp.com",
  projectId: "spring-again-5beef",
  storageBucket: "spring-again-5beef.appspot.com",
  messagingSenderId: "230998888543",
  appId: "1:230998888543:web:838ddfcde96b275516cbea",
  measurementId: "G-Q79MWQPK8J"
};

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
  // Firebase 초기화
  const app = initializeApp(firebaseConfig);
  const auth = initializeFirebaseAuth(app);
  const db = getFirestore(app);
  
  // 전역 변수에 등록
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseDb = db;
  
  // UI 초기화
  initializeUI();
  
  // 카카오 SDK 초기화
  initializeKakao();
  
  // 인증 상태 관찰자 설정
  setupAuthStateObserver(function(userInfo) {
    if (userInfo) {
      console.log('로그인 상태:', userInfo);
      
      updateUserProfileUI(userInfo);
      
      // 이메일 인증 확인 (Firebase로 가입한 경우)
      if (userInfo.provider === 'password' && !userInfo.emailVerified) {
        showEmailVerificationBanner();
      } else {
        hideEmailVerificationBanner();
      }
      
      // 프로필 완료 여부 확인
      checkProfileCompletion(userInfo.id);
    } else {
      console.log('로그아웃 상태');
      updateUserProfileUIForLogout();
      hideEmailVerificationBanner();
      hideProfileCompletionBanner();
    }
  });
  
  // 인증 관련 이벤트 리스너 설정
  setupAuthEventListeners();
  
  console.log('웹사이트가 초기화되었습니다.');
});

// 이메일 인증 배너 표시
function showEmailVerificationBanner() {
  // 기존 배너가 있으면 제거
  const existingBanner = document.getElementById('email-verification-banner');
  if (existingBanner) existingBanner.remove();
  
  // 새 배너 생성
  const banner = document.createElement('div');
  banner.id = 'email-verification-banner';
  banner.className = 'bg-yellow-50 border-b border-yellow-100 p-3';
  banner.innerHTML = `
    <div class="container mx-auto px-4 flex items-center justify-between">
      <div class="flex items-center">
        <i data-lucide="alert-circle" class="h-5 w-5 text-yellow-500 mr-2"></i>
        <span class="text-sm text-yellow-700">이메일 인증이 필요합니다. 메일함을 확인해주세요.</span>
      </div>
      <div class="flex space-x-2">
        <button id="resend-verification-email" class="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">인증 메일 재발송</button>
        <button id="check-verification" class="text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">인증 확인</button>
        <button id="close-banner" class="text-yellow-500 hover:text-yellow-700">
          <i data-lucide="x" class="h-4 w-4"></i>
        </button>
      </div>
    </div>
  `;
  
  // 문서에 추가
  const header = document.querySelector('header');
  if (header) {
    header.parentNode.insertBefore(banner, header.nextSibling);
    
    // 아이콘 초기화
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // 이벤트 리스너 추가
    document.getElementById('resend-verification-email').addEventListener('click', async function() {
      try {
        await resendEmailVerification();
        alert('인증 메일이 재발송되었습니다. 이메일을 확인해주세요.');
      } catch (error) {
        alert(error.message || '인증 메일 발송 중 오류가 발생했습니다.');
      }
    });
    
    document.getElementById('check-verification').addEventListener('click', async function() {
      try {
        const verified = await checkEmailVerification();
        if (verified) {
          alert('이메일 인증이 완료되었습니다!');
          hideEmailVerificationBanner();
          location.reload(); // 페이지 새로고침
        } else {
          alert('아직 이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.');
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
      }
    });
    
    document.getElementById('close-banner').addEventListener('click', function() {
      hideEmailVerificationBanner();
    });
  }
}

// 이메일 인증 배너 숨기기
function hideEmailVerificationBanner() {
  const banner = document.getElementById('email-verification-banner');
  if (banner) banner.remove();
}

// 프로필 완료 배너 표시
function showProfileCompletionBanner() {
  // 기존 배너가 있으면 제거
  const existingBanner = document.getElementById('profile-completion-banner');
  if (existingBanner) existingBanner.remove();
  
  // 새 배너 생성
  const banner = document.createElement('div');
  banner.id = 'profile-completion-banner';
  banner.className = 'bg-blue-50 border-b border-blue-100 p-3';
  banner.innerHTML = `
    <div class="container mx-auto px-4 flex items-center justify-between">
      <div class="flex items-center">
        <i data-lucide="user" class="h-5 w-5 text-blue-500 mr-2"></i>
        <span class="text-sm text-blue-700">프로필을 완성하고 더 많은 기능을 이용해보세요!</span>
      </div>
      <div class="flex space-x-2">
        <a href="profile-setup.html" class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
          프로필 설정하기
        </a>
        <button id="close-profile-banner" class="text-blue-500 hover:text-blue-700">
          <i data-lucide="x" class="h-4 w-4"></i>
        </button>
      </div>
    </div>
  `;
  
  // 문서에 추가
  const emailBanner = document.getElementById('email-verification-banner');
  const header = document.querySelector('header');
  const insertAfter = emailBanner || header;
  
  if (insertAfter) {
    insertAfter.parentNode.insertBefore(banner, insertAfter.nextSibling);
    
    // 아이콘 초기화
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // 이벤트 리스너 추가
    document.getElementById('close-profile-banner').addEventListener('click', function() {
      hideProfileCompletionBanner();
    });
  }
}

// 프로필 완료 배너 숨기기
function hideProfileCompletionBanner() {
  const banner = document.getElementById('profile-completion-banner');
  if (banner) banner.remove();
}

// 프로필 완료 여부 확인
async function checkProfileCompletion(userId) {
  try {
    const userDoc = await getDoc(doc(window.firebaseDb, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (!userData.profileCompleted) {
        showProfileCompletionBanner();
      } else {
        hideProfileCompletionBanner();
      }
    } else {
      // 사용자 문서가 없으면 프로필 완료 배너 표시
      showProfileCompletionBanner();
    }
  } catch (error) {
    console.error('프로필 상태 확인 오류:', error);
  }
}

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
          // 모달 닫기
          const loginModal = document.getElementById('loginModal');
          if (loginModal) loginModal.classList.add('hidden');
          
          // UI 업데이트
          updateUserProfileUI(userInfo);
          
          // Firebase 또는 로컬 스토리지에서 사용자의 프로필 완료 여부 확인
          let profileCompleted = false;
          
          // localStorage에서 확인
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              if (userData.profileCompleted) {
                profileCompleted = true;
              }
            } catch (error) {
              console.error('저장된 사용자 정보 처리 오류:', error);
            }
          }
          
          // Firebase에서도 확인 (가능하다면)
          if (window.firebaseDb) {
            try {
              const userDoc = await getDoc(doc(window.firebaseDb, "users", userInfo.id));
              if (userDoc.exists() && userDoc.data().profileCompleted) {
                profileCompleted = true;
              }
            } catch (error) {
              console.error('프로필 확인 오류:', error);
            }
          }
          
          alert(`${userInfo.nickname}님, 환영합니다!`);
          
          // 프로필이 완료되지 않았으면 프로필 설정 페이지로 리디렉션
          if (!profileCompleted) {
            window.location.href = 'profile-setup.html';
          }
        }
      } catch (error) {
        console.error('카카오 로그인 처리 오류:', error);
        alert(typeof error === 'string' ? error : '로그인 중 오류가 발생했습니다.');
      }
    });
  }
  
  // 카카오 회원가입 버튼 (로그인과 동일 기능)
  if (kakaoSignupBtn && kakaoLoginBtn) {
    kakaoSignupBtn.addEventListener('click', function() {
      kakaoLoginBtn.click();
    });
  }
  
  // 구글 로그인 버튼
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleSignupBtn = document.getElementById('googleSignupBtn');
  
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async function() {
      try {
        const user = await loginWithGoogle();
        if (user) {
          // 모달 닫기
          const loginModal = document.getElementById('loginModal');
          if (loginModal) loginModal.classList.add('hidden');
          
          alert(`${user.displayName || '사용자'}님, 환영합니다!`);
          
          // 프로필 완료 여부 확인 (Firebase에 정보가 있다면)
          if (window.firebaseDb) {
            try {
              const userDoc = await getDoc(doc(window.firebaseDb, "users", user.uid));
              if (!userDoc.exists() || !userDoc.data().profileCompleted) {
                // 프로필 설정 페이지로 이동
                window.location.href = 'profile-setup.html';
              }
            } catch (error) {
              console.error('프로필 확인 오류:', error);
            }
          }
        }
      } catch (error) {
        console.error('구글 로그인 처리 오류:', error);
        alert(error.message || '로그인 중 오류가 발생했습니다.');
      }
    });
  }
  
  // 구글 회원가입 버튼 (로그인과 동일 기능)
  if (googleSignupBtn && googleLoginBtn) {
    googleSignupBtn.addEventListener('click', function() {
      googleLoginBtn.click();
    });
  }
  
  // 이메일 로그인 버튼
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.addEventListener('click', async function() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        alert('이메일과 비밀번호를 모두 입력해주세요.');
        return;
      }
      
      try {
        const user = await loginWithEmail(email, password);
        if (user) {
          // 모달 닫기
          const loginModal = document.getElementById('loginModal');
          if (loginModal) loginModal.classList.add('hidden');
          
          alert(`${user.displayName || '사용자'}님, 환영합니다!`);
          
          // 프로필 완료 여부 확인 (Firebase에 정보가 있다면)
          if (window.firebaseDb) {
            try {
              const userDoc = await getDoc(doc(window.firebaseDb, "users", user.uid));
              if (!userDoc.exists() || !userDoc.data().profileCompleted) {
                // 프로필 설정 페이지로 이동
                window.location.href = 'profile-setup.html';
              }
            } catch (error) {
              console.error('프로필 확인 오류:', error);
            }
          }
        }
      } catch (error) {
        console.error('이메일 로그인 처리 오류:', error);
        alert(error.message || '로그인 중 오류가 발생했습니다.');
      }
    });
  }
  
  // 회원가입 버튼
  const signupButton = document.getElementById('signupButton');
  if (signupButton) {
    signupButton.addEventListener('click', async function() {
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
      
      try {
        const user = await registerWithEmail(name, email, password);
        if (user) {
          // 모달 닫기
          const loginModal = document.getElementById('loginModal');
          if (loginModal) loginModal.classList.add('hidden');
          
          alert(`회원가입이 완료되었습니다. 이메일 인증을 완료해주세요.`);
          
          // 프로필 설정 페이지로 이동
          window.location.href = 'profile-setup.html';
        }
      } catch (error) {
        console.error('회원가입 처리 오류:', error);
        alert(error.message || '회원가입 중 오류가 발생했습니다.');
      }
    });
  }
  
  // 비밀번호 재설정 버튼
  const resetPasswordButton = document.getElementById('resetPasswordButton');
  if (resetPasswordButton) {
    resetPasswordButton.addEventListener('click', async function() {
      const email = document.getElementById('reset-email').value;
      
      if (!email) {
        alert('이메일을 입력해주세요.');
        return;
      }
      
      try {
        await resetPassword(email);
        
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
      } catch (error) {
        console.error('비밀번호 재설정 처리 오류:', error);
        alert(error.message || '비밀번호 재설정 중 오류가 발생했습니다.');
      }
    });
  }
  
  // 로그아웃 버튼
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      try {
        await logoutUser();
        
        // 드롭다운 메뉴 닫기
        const profileDropdownMenu = document.getElementById('profileDropdownMenu');
        if (profileDropdownMenu) {
          profileDropdownMenu.classList.add('hidden');
        }
        
        alert('로그아웃 되었습니다.');
      } catch (error) {
        console.error('로그아웃 오류:', error);
        alert(error.message || '로그아웃 중 오류가 발생했습니다.');
      }
    });
  }
  
  // 모바일 로그아웃 버튼
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      try {
        await logoutUser();
        
        // 모바일 메뉴 닫기
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
          mobileMenu.classList.add('hidden');
        }
        
        alert('로그아웃 되었습니다.');
      } catch (error) {
        console.error('로그아웃 오류:', error);
        alert(error.message || '로그아웃 중 오류가 발생했습니다.');
      }
    });
  }
}
