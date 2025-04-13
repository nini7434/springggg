// ui.js - UI 관련 함수 모음

// 모달 관련 함수
export function setupModals() {
  const loginModal = document.getElementById('loginModal');
  const headerLoginBtn = document.getElementById('headerLoginBtn');
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const closeModalBtns = document.querySelectorAll('.closeModal');
  
  // 로그인 버튼 클릭 시 모달 열기
  if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('헤더 로그인 버튼 클릭됨');
      if (loginModal) loginModal.classList.remove('hidden');
    });
  }
  
  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('모바일 로그인 버튼 클릭됨');
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

// 모바일 메뉴 토글 함수
export function setupMobileMenu() {
  const mobileMenuButton = document.getElementById('mobileMenuButton');
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener('click', function() {
      const mobileMenu = document.getElementById('mobileMenu');
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
  }
  
  // 메뉴 항목 클릭 시 모바일 메뉴 닫기
  setupMenuItemClickHandlers();
}

// 메뉴 항목 클릭 시 모바일 메뉴 닫기
function setupMenuItemClickHandlers() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 100,
          behavior: 'smooth'
        });
        
        // 모바일 메뉴 닫기
        const mobileMenu = document.getElementById('mobileMenu');
        const menuButton = document.getElementById('mobileMenuButton');
        if (mobileMenu && menuButton) {
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
}
