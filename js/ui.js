// ui.js - UI 관련 함수 모음

// 사용자 프로필 UI 업데이트 함수
export function updateUserProfileUI(userInfo) {
  if (!userInfo) {
    return updateUserProfileUIForLogout();
  }
  
  const { nickname, profileImage } = userInfo;
  const displayName = nickname || '사용자';
  const photoURL = profileImage || '';
  
  // 헤더 로그인 버튼 숨기기
  const headerLoginBtn = document.getElementById('headerLoginBtn');
  if (headerLoginBtn) headerLoginBtn.classList.add('hidden');
  
  // 사용자 프로필 영역 표시
  const userProfileDropdown = document.getElementById('userProfileDropdown');
  if (userProfileDropdown) userProfileDropdown.classList.remove('hidden');
  
  // 사용자 정보 업데이트
  const userDisplayName = document.getElementById('userDisplayName');
  if (userDisplayName) userDisplayName.textContent = displayName;
  
  const userAvatarImg = document.getElementById('userAvatarImg');
  if (userAvatarImg) {
    if (photoURL) {
      userAvatarImg.src = photoURL;
    } else {
      const initial = displayName[0].toUpperCase();
      userAvatarImg.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23EC4899'/%3E%3Ctext x='12' y='16' text-anchor='middle' font-size='12' fill='white'%3E${initial}%3C/text%3E%3C/svg%3E`;
    }
  }
  
  // 모바일 UI 업데이트
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  if (mobileLoginBtn) mobileLoginBtn.classList.add('hidden');
  
  const mobileUserProfile = document.getElementById('mobileUserProfile');
  if (mobileUserProfile) mobileUserProfile.classList.remove('hidden');
  
  const mobileUserDisplayName = document.getElementById('mobileUserDisplayName');
  if (mobileUserDisplayName) mobileUserDisplayName.textContent = displayName;
  
  const mobileUserAvatarImg = document.getElementById('mobileUserAvatarImg');
  if (mobileUserAvatarImg) {
    if (photoURL) {
      mobileUserAvatarImg.src = photoURL;
    } else {
      const initial = displayName[0].toUpperCase();
      mobileUserAvatarImg.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23EC4899'/%3E%3Ctext x='12' y='16' text-anchor='middle' font-size='12' fill='white'%3E${initial}%3C/text%3E%3C/svg%3E`;
    }
  }
}

// 로그아웃 후 UI 업데이트 함수
export function updateUserProfileUIForLogout() {
  // 헤더 로그인 버튼 표시
  const headerLoginBtn = document.getElementById('headerLoginBtn');
  if (headerLoginBtn) headerLoginBtn.classList.remove('hidden');
  
  // 사용자 프로필 영역 숨기기
  const userProfileDropdown = document.getElementById('userProfileDropdown');
  if (userProfileDropdown) userProfileDropdown.classList.add('hidden');
  
  // 모바일 UI 업데이트
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  if (mobileLoginBtn) mobileLoginBtn.classList.remove('hidden');
  
  const mobileUserProfile = document.getElementById('mobileUserProfile');
  if (mobileUserProfile) mobileUserProfile.classList.add('hidden');
}

// 모달 설정 함수
export function setupModals() {
  const loginModal = document.getElementById('loginModal');
  const headerLoginBtn = document.getElementById('headerLoginBtn');
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const closeModalBtns = document.querySelectorAll('.closeModal');
  
  // 로그인 버튼 클릭 시 모달 열기
  if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (loginModal) loginModal.classList.remove('hidden');
    });
  }
  
  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (loginModal) loginModal.classList.remove('hidden');
    });
  }
  
  // 닫기 버튼
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      if (loginModal) loginModal.classList.add('hidden');
    });
  });
  
  // 모달 외부 클릭 시 닫기
  if (loginModal) {
    loginModal.addEventListener('click', function(e) {
      if (e.target === loginModal) {
        loginModal.classList.add('hidden');
      }
    });
  }
  
  // 폼 전환 (로그인 <-> 회원가입 <-> 비밀번호 찾기)
  setupFormSwitching();
}

// 폼 전환 함수
function setupFormSwitching() {
  const showSignupLink = document.getElementById('showSignup');
  const showLoginLink = document.getElementById('showLogin');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const forgotPasswordLink = document.getElementById('forgotPassword');
  const backToLoginLink = document.getElementById('backToLogin');
  const modalTitle = document.getElementById('modal-title');
  
  if (showSignupLink && loginForm && signupForm && modalTitle) {
    showSignupLink.addEventListener('click', function(e) {
      e.preventDefault();
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');
      modalTitle.textContent = '회원가입';
    });
  }
  
  if (showLoginLink && loginForm && signupForm && modalTitle) {
    showLoginLink.addEventListener('click', function(e) {
      e.preventDefault();
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
      if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');
      modalTitle.textContent = '로그인';
    });
  }
  
  if (forgotPasswordLink && loginForm && forgotPasswordForm && modalTitle) {
    forgotPasswordLink.addEventListener('click', function(e) {
      e.preventDefault();
      loginForm.classList.add('hidden');
      if (signupForm) signupForm.classList.add('hidden');
      forgotPasswordForm.classList.remove('hidden');
      modalTitle.textContent = '비밀번호 찾기';
    });
  }
  
  if (backToLoginLink && loginForm && forgotPasswordForm && modalTitle) {
    backToLoginLink.addEventListener('click', function(e) {
      e.preventDefault();
      loginForm.classList.remove('hidden');
      if (signupForm) signupForm.classList.add('hidden');
      forgotPasswordForm.classList.add('hidden');
      modalTitle.textContent = '로그인';
    });
  }
}

// 프로필 드롭다운 설정 함수
export function setupProfileDropdown() {
  const userProfileBtn = document.getElementById('userProfileBtn');
  const profileDropdownMenu = document.getElementById('profileDropdownMenu');
  
  if (userProfileBtn && profileDropdownMenu) {
    userProfileBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      profileDropdownMenu.classList.toggle('hidden');
      
      // Lucide 아이콘 새로고침
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
    
    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', function(e) {
      if (!userProfileBtn.contains(e.target) && !profileDropdownMenu.contains(e.target)) {
        profileDropdownMenu.classList.add('hidden');
      }
    });
  }
}

// 모바일 메뉴 토글 함수
export function setupMobileMenu() {
  const mobileMenuButton = document.getElementById('mobileMenuButton');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
        this.setAttribute('aria-expanded', 'true');
        this.innerHTML = '<i data-lucide="x" class="h-6 w-6"></i>';
        lucide.createIcons();
      } else {
        mobileMenu.classList.add('hidden');
        this.setAttribute('aria-expanded', 'false');
        this.innerHTML = '<i data-lucide="menu" class="h-6 w-6"></i>';
        lucide.createIcons();
      }
    });
    
    // 메뉴 항목 클릭 시 모바일 메뉴 닫기
    setupMenuItemClickHandlers();
  }
}

// 메뉴 항목 클릭 시 모바일 메뉴 닫기
function setupMenuItemClickHandlers() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        window.scrollTo({
          top: targetElement.offsetTop - 100,
          behavior: 'smooth'
        });
        
        // 모바일 메뉴 닫기
        const mobileMenu = document.getElementById('mobileMenu');
        const menuButton = document.getElementById('mobileMenuButton');
        if (mobileMenu && menuButton && window.innerWidth < 768) {
          mobileMenu.classList.add('hidden');
          menuButton.setAttribute('aria-expanded', 'false');
          menuButton.innerHTML = '<i data-lucide="menu" class="h-6 w-6"></i>';
          lucide.createIcons();
        }
      }
    });
  });
}

// 웹사이트 초기화 함수
export function initializeUI() {
  // 아이콘 초기화
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // 모달 설정
  setupModals();
  
  // 모바일 메뉴 설정
  setupMobileMenu();
  
  // 프로필 드롭다운 설정
  setupProfileDropdown();
}
