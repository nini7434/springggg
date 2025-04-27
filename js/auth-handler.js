// auth-handler.js - 인증 관련 핸들러 함수 모음

// 카카오 초기화 함수
export function initializeKakao() {
  if (typeof Kakao !== 'undefined') {
    if (!Kakao.isInitialized()) {
      Kakao.init('9bd5d7401c90c3e6435c23a3cbb46272');
      console.log('카카오 SDK 초기화 상태:', Kakao.isInitialized());
    }
  } else {
    console.error('카카오 SDK가 로드되지 않았습니다');
  }
}

// 카카오 로그인 처리 함수
export function handleKakaoLogin() {
  console.log('카카오 로그인 시도');
  
  if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
    alert('카카오 SDK가 초기화되지 않았습니다');
    return Promise.reject('카카오 SDK 초기화 실패');
  }
  
  // 현재 경로 저장
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  const currentHash = window.location.hash;

  // 전체 URL을 그대로 저장
  const currentUrl = currentPath + currentSearch + currentHash;
  localStorage.setItem('kakaoLoginReturnPath', currentUrl);
  
  return new Promise((resolve, reject) => {
    // 카카오 로그인 팝업 열기 - 기본 동의 항목만 사용(scope 제거)
    Kakao.Auth.login({
      success: function(authObj) {
        console.log('카카오 로그인 성공:', authObj);
        
        // 사용자 정보 요청
        Kakao.API.request({
          url: '/v2/user/me',
          success: function(res) {
            console.log('카카오 사용자 정보:', res);
            
            const userInfo = {
              id: `kakao:${res.id}`, // Firebase 사용자 ID로 사용하기 위해 접두어 추가
              nickname: res.properties?.nickname || '사용자',
              profileImage: res.properties?.profile_image || '',
              email: res.kakao_account?.email || '',
              provider: 'kakao',
              loginTime: new Date().toISOString(),
              profileCompleted: false // 기본값은 false로 설정
            };
            
            // 로컬 스토리지에 사용자 정보 저장 (세션 유지를 위함)
            localStorage.setItem('currentUser', JSON.stringify(userInfo));
            localStorage.setItem('kakaoLoginSuccess', 'true');
            
            // 리디렉션 감지
            if (window.location.pathname === '/springggg/' || 
                window.location.pathname === '/springggg/index.html') {
              // 메인 페이지로 리디렉션된 경우, 저장된 경로로 다시 이동
              const returnPath = localStorage.getItem('kakaoLoginReturnPath');
              if (returnPath && returnPath !== '/springggg/' && returnPath !== '/springggg/index.html') {
                console.log('원래 페이지로 돌아갑니다:', returnPath);
                // setTimeout을 사용해 약간의 지연 후 리디렉션
                setTimeout(() => {
                  window.location.href = returnPath;
                }, 100);
                return;
              }
            }
            
            // 사용자 UI 업데이트 함수 호출
            import('./ui.js').then(ui => {
              ui.updateUserProfileUI(userInfo);
              
              // 모달 닫기
              const loginModal = document.getElementById('loginModal');
              if (loginModal) {
                loginModal.classList.add('hidden');
              }
            });
            
            resolve(userInfo);
          },
          fail: function(error) {
            console.error('카카오 사용자 정보 요청 실패:', error);
            reject('사용자 정보를 가져오는데 실패했습니다.');
          }
        });
      },
      fail: function(err) {
        console.error('카카오 로그인 실패:', err);
        reject('카카오 로그인에 실패했습니다.');
      }
    });
  });
}

// 카카오 로그아웃 처리 함수
export function handleKakaoLogout() {
  if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
    console.warn('카카오 SDK가 초기화되지 않았습니다');
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    if (Kakao.Auth.getAccessToken()) {
      Kakao.Auth.logout(() => {
        console.log('카카오 로그아웃 성공');
        
        // 로컬 스토리지에서 사용자 정보 제거
        localStorage.removeItem('currentUser');
        localStorage.removeItem('kakaoLoginSuccess');
        localStorage.removeItem('kakaoLoginReturnPath');
        
        // 사용자 UI 업데이트 함수 호출
        import('./ui.js').then(ui => {
          ui.updateUserProfileUIForLogout();
        });
        
        resolve();
      });
    } else {
      // 로컬 스토리지에서 사용자 정보 제거
      localStorage.removeItem('currentUser');
      localStorage.removeItem('kakaoLoginSuccess');
      localStorage.removeItem('kakaoLoginReturnPath');
      
      // 사용자 UI 업데이트 함수 호출
      import('./ui.js').then(ui => {
        ui.updateUserProfileUIForLogout();
      });
      
      resolve();
    }
  });
}

// 로그인 상태 확인 함수
export function checkLoginStatus() {
  // 로컬 스토리지에서 사용자 정보 확인
  const currentUser = localStorage.getItem('currentUser');
  
  if (currentUser) {
    try {
      const userData = JSON.parse(currentUser);
      // 로그인 정보가 24시간 이내인지 확인
      const loginTime = new Date(userData.loginTime);
      const currentTime = new Date();
      const hoursSinceLogin = (currentTime - loginTime) / (1000 * 60 * 60);
      
      if (hoursSinceLogin < 24) {
        // 24시간 이내라면 자동 로그인
        console.log('저장된 로그인 정보로 자동 로그인:', userData.nickname);
        
        // 사용자 UI 업데이트 함수 호출
        import('./ui.js').then(ui => {
          ui.updateUserProfileUI(userData);
        });
        
        return userData;
      } else {
        // 로그인 시간이 24시간을 초과했으면 로그아웃 처리
        localStorage.removeItem('currentUser');
        localStorage.removeItem('kakaoLoginSuccess');
        localStorage.removeItem('kakaoLoginReturnPath');
      }
    } catch (error) {
      console.error('저장된 로그인 정보 처리 중 오류:', error);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('kakaoLoginSuccess');
      localStorage.removeItem('kakaoLoginReturnPath');
    }
  }
  
  // 카카오 로그인 상태 확인
  if (typeof Kakao !== 'undefined' && Kakao.isInitialized() && Kakao.Auth.getAccessToken()) {
    return new Promise((resolve, reject) => {
      Kakao.API.request({
        url: '/v2/user/me',
        success: function(res) {
          console.log('카카오 자동 로그인 성공:', res);
          const userInfo = {
            id: `kakao:${res.id}`,
            nickname: res.properties?.nickname || '사용자',
            profileImage: res.properties?.profile_image || '',
            email: res.kakao_account?.email || '',
            provider: 'kakao',
            loginTime: new Date().toISOString(),
            profileCompleted: false // 기본값은 false로 설정
          };
          
          // 로컬 스토리지 업데이트
          localStorage.setItem('currentUser', JSON.stringify(userInfo));
          localStorage.setItem('kakaoLoginSuccess', 'true');
          
          // 사용자 UI 업데이트 함수 호출
          import('./ui.js').then(ui => {
            ui.updateUserProfileUI(userInfo);
          });
          
          resolve(userInfo);
        },
        fail: function(error) {
          console.error('카카오 자동 로그인 실패:', error);
          reject(null);
        }
      });
    });
  }
  
  return null;
}

// 로그인 완료 처리 함수
export function completeLogin(userInfo) {
  if (!userInfo) return;
  
  // 로그인 상태 저장
  const userData = {
    ...userInfo,
    loginTime: new Date().toISOString()
  };
  
  localStorage.setItem('currentUser', JSON.stringify(userData));
  
  // 사용자 UI 업데이트 함수 호출
  import('./ui.js').then(ui => {
    ui.updateUserProfileUI(userData);
  });
  
  return userData;
}

// 로그아웃 처리 함수
export function handleLogout() {
  // 로컬 스토리지에서 사용자 정보 삭제
  localStorage.removeItem('currentUser');
  localStorage.removeItem('kakaoLoginSuccess');
  localStorage.removeItem('kakaoLoginReturnPath');
  
  // 사용자 UI 업데이트 함수 호출
  import('./ui.js').then(ui => {
    ui.updateUserProfileUIForLogout();
  });
  
  // 카카오 로그아웃
  return handleKakaoLogout();
}

// Firebase 인증 상태 관찰자 설정 (Firebase 사용 시)
export function setupAuthStateObserver(auth, callback) {
  if (!auth) return;
  
  return auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('Firebase 인증: 로그인 상태');
      const userInfo = {
        id: user.uid,
        nickname: user.displayName || '사용자',
        profileImage: user.photoURL || '',
        email: user.email || '',
        provider: 'firebase',
        loginTime: new Date().toISOString()
      };
      callback(userInfo);
    } else {
      console.log('Firebase 인증: 로그아웃 상태');
      
      // Firebase에 로그인되지 않았으나 로컬 스토리지에 사용자 정보가 있는 경우 확인
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const userData = JSON.parse(currentUser);
          if (userData.provider === 'kakao') {
            // 카카오 로그인 상태 확인
            if (typeof Kakao !== 'undefined' && Kakao.isInitialized() && Kakao.Auth.getAccessToken()) {
              // 카카오 로그인 상태라면 해당 정보로 콜백 호출
              callback(userData);
              return;
            }
          }
        } catch (error) {
          console.error('로컬 스토리지 사용자 정보 처리 오류:', error);
        }
      }
      
      callback(null);
    }
  });
}
