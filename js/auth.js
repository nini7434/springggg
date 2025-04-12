// auth.js - 로그인 및 회원가입 기능을 위한 JavaScript 코드
// 이 코드를 js/auth.js 파일로 저장하고 HTML에서 참조합니다

// Firebase 인증 관련 모듈 import
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

// Firestore 데이터베이스 모듈 import
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Firebase 앱이 이미 초기화되었다고 가정하고 인증 및 DB 객체 참조
const auth = getAuth();
const db = getFirestore();
const googleProvider = new GoogleAuthProvider();

// DOM 요소 참조
document.addEventListener('DOMContentLoaded', function() {
  // 헤더의 로그인 버튼
  const headerLoginBtn = document.querySelector('header a:last-child');
  
  // 모달 관련 요소
  const loginModal = document.getElementById('loginModal');
  const closeModalButtons = document.querySelectorAll('.closeModal');
  
  // 폼 관련 요소
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  
  // 모달 내부 네비게이션 링크
  const showSignupLink = document.getElementById('showSignup');
  const showLoginLink = document.getElementById('showLogin');
  const forgotPasswordLink = document.getElementById('forgotPassword');
  const backToLoginLink = document.getElementById('backToLogin');
  
  // 로그인/회원가입 버튼
  const loginButton = document.getElementById('loginButton');
  const signupButton = document.getElementById('signupButton');
  const resetPasswordButton = document.getElementById('resetPasswordButton');
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleSignupBtn = document.getElementById('googleSignupBtn');
  const kakaoLoginBtn = document.getElementById('kakaoLoginBtn');
  const kakaoSignupBtn = document.getElementById('kakaoSignupBtn');
  
  // 사용자 프로필 관련 요소
  const userProfileDropdown = document.getElementById('userProfileDropdown');
  const userProfileBtn = document.getElementById('userProfileBtn');
  const profileDropdownMenu = document.getElementById('profileDropdownMenu');
  const userAvatarImg = document.getElementById('userAvatarImg');
  const userDisplayName = document.getElementById('userDisplayName');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // 모달 표시/숨김 함수
  function showModal() {
    loginModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden'); // 스크롤 방지
  }
  
  function hideModal() {
    loginModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
  
  // 폼 전환 함수
  function showLoginFormFunc() {
    document.getElementById('modal-title').textContent = '로그인';
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    forgotPasswordForm.classList.add('hidden');
  }
  
  function showSignupFormFunc() {
    document.getElementById('modal-title').textContent = '회원가입';
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    forgotPasswordForm.classList.add('hidden');
  }
  
  function showForgotPasswordFormFunc() {
    document.getElementById('modal-title').textContent = '비밀번호 찾기';
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    forgotPasswordForm.classList.remove('hidden');
  }
  
  // 로그인 상태에 따른 UI 업데이트
  function updateUIBasedOnAuthState(user) {
    if (user) {
      // 로그인 상태
      headerLoginBtn.classList.add('hidden');
      userProfileDropdown.classList.remove('hidden');
      
      // 사용자 정보 표시
      userDisplayName.textContent = user.displayName || '사용자';
      if (user.photoURL) {
        userAvatarImg.src = user.photoURL;
      } else {
        // 이름의 첫 글자를 아바타로 사용
        const initial = (user.displayName || '사용자')[0].toUpperCase();
        userAvatarImg.src = `https://via.placeholder.com/36/EC4899/ffffff?text=${initial}`;
      }
      
      // 사용자 정보를 Firestore에 저장/업데이트
      updateUserInFirestore(user);
      
    } else {
      // 로그아웃 상태
      headerLoginBtn.classList.remove('hidden');
      userProfileDropdown.classList.add('hidden');
    }
  }
  
  // 사용자 정보를 Firestore에 저장/업데이트
  async function updateUserInFirestore(user) {
    if (!user) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      const userData = {
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        lastLogin: serverTimestamp()
      };
      
      if (!userDoc.exists()) {
        // 새 사용자인 경우 추가 정보 설정
        userData.createdAt = serverTimestamp();
        await setDoc(userRef, userData);
      } else {
        // 기존 사용자인 경우 정보 업데이트
        await setDoc(userRef, userData, { merge: true });
      }
    } catch (error) {
      console.error('사용자 정보 저장 중 오류 발생:', error);
    }
  }
  
  // 이메일/비밀번호 로그인 함수
  async function loginWithEmailPassword() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      alert('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      hideModal();
    } catch (error) {
      handleAuthError(error);
    }
  }
  
  // 이메일/비밀번호 회원가입 함수
  async function signupWithEmailPassword() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    const terms = document.getElementById('terms').checked;
    
    if (!name || !email || !password) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }
    
    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (!terms) {
      alert('이용약관 및 개인정보처리방침에 동의해주세요.');
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 사용자 프로필 업데이트
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      hideModal();
    } catch (error) {
      handleAuthError(error);
    }
  }
  
  // 비밀번호 재설정 함수
  async function sendPasswordReset() {
    const email = document.getElementById('reset-email').value;
    
    if (!email) {
      alert('이메일을 입력해주세요.');
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      alert('비밀번호 재설정 링크가 이메일로 발송되었습니다.');
      showLoginFormFunc();
    } catch (error) {
      handleAuthError(error);
    }
  }
  
  // Google 로그인 함수
  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      hideModal();
    } catch (error) {
      handleAuthError(error);
    }
  }
  
  // 카카오 로그인 함수 (SDK 로드 필요)
  function loginWithKakao() {
    if (typeof Kakao === 'undefined') {
      alert('카카오 SDK가 로드되지 않았습니다.');
      return;
    }
    
    Kakao.Auth.login({
      success: function(authObj) {
        // 카카오 로그인 성공 후 사용자 정보 요청
        Kakao.API.request({
          url: '/v2/user/me',
          success: function(response) {
            // Firebase Custom Auth와 연동하려면 서버측 코드가 필요
            // 여기서는 간단히 콘솔에 출력만 합니다
            console.log(response);
            
            // 사용자 정보 표시 (실제로는 Firebase와 연동 필요)
            const kakaoUser = {
              uid: 'kakao_' + response.id,
              displayName: response.properties.nickname,
              email: response.kakao_account.email,
              photoURL: response.properties.thumbnail_image
            };
            
            alert('카카오 로그인에 성공했습니다! (서버 연동 필요)');
            hideModal();
          },
          fail: function(error) {
            console.error('카카오 사용자 정보 요청 실패:', error);
            alert('카카오 로그인에 실패했습니다.');
          }
        });
      },
      fail: function(err) {
        console.error('카카오 로그인 실패:', err);
        alert('카카오 로그인에 실패했습니다.');
      }
    });
  }
  
  // 로그아웃 함수
  async function logout() {
    try {
      await signOut(auth);
      profileDropdownMenu.classList.add('hidden');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      alert('로그아웃에 실패했습니다.');
    }
  }
  
  // 인증 오류 처리 함수
  function handleAuthError(error) {
    const errorCode = error.code;
    let errorMessage = '오류가 발생했습니다. 다시 시도해주세요.';
    
    switch (errorCode) {
      case 'auth/invalid-email':
        errorMessage = '유효하지 않은 이메일 형식입니다.';
        break;
      case 'auth/user-disabled':
        errorMessage = '해당 사용자 계정이 비활성화되었습니다.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
        break;
      case 'auth/email-already-in-use':
        errorMessage = '이미 사용 중인 이메일 주소입니다.';
        break;
      case 'auth/weak-password':
        errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
        break;
      case 'auth/too-many-requests':
        errorMessage = '너무 많은 로그인 시도. 잠시 후 다시 시도해주세요.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = '이 인증 방법은 현재 사용할 수 없습니다.';
        break;
      case 'auth/popup-closed-by-user':
        // 사용자가 팝업을 닫은 경우 아무것도 표시하지 않음
        return;
    }
    
    alert(errorMessage);
    console.error(error.code, error.message);
  }
  
  // 이벤트 리스너 등록
  // 모달 열기/닫기
  headerLoginBtn.addEventListener('click', function(e) {
    e.preventDefault();
    showModal();
  });
  
  closeModalButtons.forEach(button => {
    button.addEventListener('click', hideModal);
  });
  
  // 모달 외부 클릭 시 닫기
  loginModal.addEventListener('click', function(e) {
    if (e.target === loginModal) {
      hideModal();
    }
  });
  
  // ESC 키로 모달 닫기
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !loginModal.classList.contains('hidden')) {
      hideModal();
    }
  });
  
  // 폼 전환
  showSignupLink.addEventListener('click', function(e) {
    e.preventDefault();
    showSignupFormFunc();
  });
  
  showLoginLink.addEventListener('click', function(e) {
    e.preventDefault();
    showLoginFormFunc();
  });
  
  forgotPasswordLink.addEventListener('click', function(e) {
    e.preventDefault();
    showForgotPasswordFormFunc();
  });
  
  backToLoginLink.addEventListener('click', function(e) {
    e.preventDefault();
    showLoginFormFunc();
  });
  
  // 로그인/회원가입 버튼 기능
  loginButton.addEventListener('click', loginWithEmailPassword);
  signupButton.addEventListener('click', signupWithEmailPassword);
  resetPasswordButton.addEventListener('click', sendPasswordReset);
  
  // 소셜 로그인 버튼
  googleLoginBtn.addEventListener('click', signInWithGoogle);
  googleSignupBtn.addEventListener('click', signInWithGoogle);
  kakaoLoginBtn.addEventListener('click', loginWithKakao);
  kakaoSignupBtn.addEventListener('click', loginWithKakao);
  
  // 로그아웃 버튼
  logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    logout();
  });
  
  // 프로필 드롭다운 토글
  userProfileBtn.addEventListener('click', function() {
    profileDropdownMenu.classList.toggle('hidden');
  });
  
  // 드롭다운 외부 클릭 시 닫기
  document.addEventListener('click', function(e) {
    if (profileDropdownMenu && !profileDropdownMenu.classList.contains('hidden') && 
        !userProfileBtn.contains(e.target) && !profileDropdownMenu.contains(e.target)) {
      profileDropdownMenu.classList.add('hidden');
    }
  });
  
  // 인증 상태 감지
  onAuthStateChanged(auth, updateUIBasedOnAuthState);
  
  // 폼 제출 시 기본 동작 방지
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
    });
  });
});

// Enter 키로 로그인/회원가입 시도
document.getElementById('password').addEventListener('keyup', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('loginButton').click();
  }
});

document.getElementById('signup-password-confirm').addEventListener('keyup', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('signupButton').click();
  }
});

document.getElementById('reset-email').addEventListener('keyup', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('resetPasswordButton').click();
  }
});
