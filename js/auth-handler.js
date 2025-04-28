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
    // 카카오 SDK를 동적으로 로드하는 시도
    loadKakaoSDK();
  }
}

// 카카오 SDK 동적 로드 함수
function loadKakaoSDK() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.onload = () => {
      console.log('카카오 SDK 로드 완료');
      if (!Kakao.isInitialized()) {
        Kakao.init('9bd5d7401c90c3e6435c23a3cbb46272');
        console.log('카카오 SDK 초기화 상태:', Kakao.isInitialized());
      }
      resolve();
    };
    script.onerror = () => {
      console.error('카카오 SDK 로드 실패');
      reject(new Error('카카오 SDK 로드 실패'));
    };
    document.head.appendChild(script);
  });
}

// 카카오 로그인 처리 함수
export function handleKakaoLogin() {
  console.log('카카오 로그인 시도');
  
  // 카카오 SDK 초기화 확인
  if (typeof Kakao === 'undefined') {
    console.log('카카오 SDK가 정의되지 않았습니다. 로드를 시도합니다.');
    return loadKakaoSDK().then(() => {
      return proceedWithKakaoLogin();
    }).catch(error => {
      alert('카카오 로그인을 위한 SDK 로드에 실패했습니다.');
      return Promise.reject(error);
    });
  } else if (!Kakao.isInitialized()) {
    Kakao.init('9bd5d7401c90c3e6435c23a3cbb46272');
    console.log('카카오 SDK 초기화 상태 (재시도):', Kakao.isInitialized());
    if (!Kakao.isInitialized()) {
      alert('카카오 SDK 초기화에 실패했습니다');
      return Promise.reject('카카오 SDK 초기화 실패');
    }
  }
  
  return proceedWithKakaoLogin();
}

// 실제 카카오 로그인 프로세스
function proceedWithKakaoLogin() {
  // 현재 경로 저장 (앱 배포 경로를 고려한 절대 URL로)
  const baseUrl = window.location.origin + '/springggg'; // GitHub Pages 기준
  const currentPath = window.location.pathname.replace('/springggg', '') || '/';
  const currentSearch = window.location.search;
  const currentHash = window.location.hash;

  // 전체 URL을 그대로 저장 (GitHub Pages 경로 고려)
  const currentUrl = currentPath + currentSearch + currentHash;
  localStorage.setItem('kakaoLoginReturnPath', currentUrl);
  console.log('로그인 후 돌아갈 경로:', currentUrl);
  
  return new Promise((resolve, reject) => {
    // 카카오 로그인 팝업 열기
    Kakao.Auth.login({
      success: function(authObj) {
        console.log('카카오 로그인 성공:', authObj);
        
        // 토큰 유효성 확인
        if (!authObj.access_token) {
          console.error('액세스 토큰이 없습니다');
          reject('액세스 토큰이 없습니다');
          return;
        }
        
        // 사용자 정보 요청
        Kakao.API.request({
          url: '/v2/user/me',
          success: function(res) {
            console.log('카카오 사용자 정보:', res);
            
            // 필수 정보가 있는지 확인
            if (!res.id) {
              console.error('사용자 ID가 없습니다');
              reject('사용자 ID를 가져올 수 없습니다');
              return;
            }
            
            const userInfo = {
              id: `kakao:${res.id}`, // Firebase 사용자 ID로 사용하기 위해 접두어 추가
              nickname: res.properties?.nickname || '사용자',
              profileImage: res.properties?.profile_image || '',
              email: res.kakao_account?.email || '',
              provider: 'kakao',
              loginTime: new Date().toISOString(),
              profileCompleted: false, // 기본값은 false로 설정
              accessToken: authObj.access_token, // 액세스 토큰 저장
              refreshToken: authObj.refresh_token, // 리프레시 토큰 저장
              expiresIn: authObj.expires_in // 만료 시간 저장
            };
            
            // 로컬 스토리지에 사용자 정보 저장 (세션 유지를 위함)
            localStorage.setItem('currentUser', JSON.stringify(userInfo));
            localStorage.setItem('kakaoLoginSuccess', 'true');
            
            // 사용자 UI 업데이트 처리
            handleUIUpdate(userInfo);
            
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
      },
      // 이메일 권한을 제외한 기본 권한만 요청
      scope: 'profile_nickname,profile_image'
    });
  });
}

// UI 업데이트 함수
function handleUIUpdate(userInfo) {
  // 동적 UI 업데이트 처리
  setTimeout(() => {
    // 모듈 가져오기
    import('./ui.js').then(ui => {
      ui.updateUserProfileUI(userInfo);
      
      // 모달 닫기
      const loginModal = document.getElementById('loginModal');
      if (loginModal) {
        loginModal.classList.add('hidden');
      }
      
      // 리디렉션 처리
      redirectAfterLogin();
    }).catch(error => {
      console.error('UI 모듈 로드 실패:', error);
    });
  }, 100);
}

// 로그인 후 리디렉션 처리
function redirectAfterLogin() {
  // 저장된 경로로 리디렉션
  const returnPath = localStorage.getItem('kakaoLoginReturnPath');
  const currentPathname = window.location.pathname;
  
  // 현재 페이지가 메인 또는 로그인 페이지이고, 다른 페이지로 돌아가야 하는 경우
  if ((currentPathname === '/springggg/' || 
      currentPathname === '/springggg/index.html' ||
      currentPathname === '/') && 
      returnPath && 
      returnPath !== '/' && 
      returnPath !== '/index.html') {
    
    console.log('원래 페이지로 돌아갑니다:', returnPath);
    
    // GitHub Pages 배포 경로를 고려한 URL 구성
    let redirectUrl = returnPath;
    if (!returnPath.startsWith('/springggg') && !returnPath.startsWith('http')) {
      redirectUrl = '/springggg' + (returnPath.startsWith('/') ? '' : '/') + returnPath;
    }
    
    console.log('리디렉션 URL:', redirectUrl);
    window.location.href = redirectUrl;
  }
}

// 카카오 로그아웃 처리 함수
export function handleKakaoLogout() {
  if (typeof Kakao === 'undefined') {
    console.warn('카카오 SDK가 정의되지 않았습니다');
    return Promise.resolve();
  }
  
  if (!Kakao.isInitialized()) {
    Kakao.init('9bd5d7401c90c3e6435c23a3cbb46272');
    console.log('카카오 SDK 초기화 상태 (로그아웃 시):', Kakao.isInitialized());
  }
  
  return new Promise((resolve) => {
    if (Kakao.Auth.getAccessToken()) {
      Kakao.Auth.logout(() => {
        console.log('카카오 로그아웃 성공');
        
        // 로컬 스토리지에서 사용자 정보 제거
        clearLoginData();
        
        // 사용자 UI 업데이트 함수 호출
        import('./ui.js').then(ui => {
          ui.updateUserProfileUIForLogout();
        }).catch(error => {
          console.error('UI 모듈 로드 실패:', error);
        });
        
        resolve();
      });
    } else {
      // 로컬 스토리지에서 사용자 정보 제거
      clearLoginData();
      
      // 사용자 UI 업데이트 함수 호출
      import('./ui.js').then(ui => {
        ui.updateUserProfileUIForLogout();
      }).catch(error => {
        console.error('UI 모듈 로드 실패:', error);
      });
      
      resolve();
    }
  });
}

// 로그인 데이터 정리 함수
function clearLoginData() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('kakaoLoginSuccess');
  localStorage.removeItem('kakaoLoginReturnPath');
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
        
        // 액세스 토큰 확인 및 갱신 필요 시 갱신
        if (userData.provider === 'kakao' && userData.accessToken) {
          refreshKakaoTokenIfNeeded(userData);
        }
        
        // 사용자 UI 업데이트 함수 호출
        import('./ui.js').then(ui => {
          ui.updateUserProfileUI(userData);
        }).catch(error => {
          console.error('UI 모듈 로드 실패:', error);
        });
        
        return userData;
      } else {
        // 로그인 시간이 24시간을 초과했으면 로그아웃 처리
        clearLoginData();
      }
    } catch (error) {
      console.error('저장된 로그인 정보 처리 중 오류:', error);
      clearLoginData();
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
            // 이메일 권한이 없으므로 빈 문자열로 설정
            email: '',
            provider: 'kakao',
            loginTime: new Date().toISOString(),
            profileCompleted: false, // 기본값은 false로 설정
            accessToken: Kakao.Auth.getAccessToken()
          };
          
          // 로컬 스토리지 업데이트
          localStorage.setItem('currentUser', JSON.stringify(userInfo));
          localStorage.setItem('kakaoLoginSuccess', 'true');
          
          // 사용자 UI 업데이트 함수 호출
          import('./ui.js').then(ui => {
            ui.updateUserProfileUI(userInfo);
          }).catch(error => {
            console.error('UI 모듈 로드 실패:', error);
          });
          
          resolve(userInfo);
        },
        fail: function(error) {
          console.error('카카오 자동 로그인 실패:', error);
          
          // 토큰이 만료된 경우 로그아웃 처리
          if (error.status === 401) {
            Kakao.Auth.logout(() => {
              clearLoginData();
            });
          }
          
          reject(null);
        }
      });
    });
  }
  
  return null;
}

// 카카오 토큰 갱신 필요시 갱신 시도
function refreshKakaoTokenIfNeeded(userData) {
  // 토큰 만료 시간 확인 (만료 10분 전에 갱신)
  const expiresIn = userData.expiresIn || 7199; // 기본 만료 시간 (약 2시간)
  const loginTime = new Date(userData.loginTime);
  const currentTime = new Date();
  const secondsSinceLogin = (currentTime - loginTime) / 1000;
  
  // 만료 10분 전이라면 갱신 시도
  if (secondsSinceLogin > (expiresIn - 600)) {
    console.log('카카오 토큰 갱신이 필요합니다');
    
    // 리프레시 토큰이 있는 경우만 갱신 시도
    if (userData.refreshToken && typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
      try {
        // 토큰 갱신 API 호출
        Kakao.Auth.updateAccessToken(userData.refreshToken)
          .then(token => {
            console.log('카카오 토큰 갱신 성공:', token);
            
            // 새 토큰 정보로 사용자 데이터 업데이트
            const updatedUserData = {
              ...userData,
              accessToken: token.access_token,
              refreshToken: token.refresh_token || userData.refreshToken,
              expiresIn: token.expires_in || 7199,
              loginTime: new Date().toISOString() // 로그인 시간 갱신
            };
            
            // 로컬 스토리지 업데이트
            localStorage.setItem('currentUser', JSON.stringify(updatedUserData));
          })
          .catch(error => {
            console.error('카카오 토큰 갱신 실패:', error);
            // 갱신 실패 시 로그아웃 처리
            handleKakaoLogout();
          });
      } catch (error) {
        console.error('카카오 토큰 갱신 시도 중 오류:', error);
      }
    }
  }
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
  }).catch(error => {
    console.error('UI 모듈 로드 실패:', error);
  });
  
  return userData;
}

// 로그아웃 처리 함수
export function handleLogout() {
  // 로컬 스토리지에서 사용자 정보 삭제
  clearLoginData();
  
  // 사용자 UI 업데이트 함수 호출
  import('./ui.js').then(ui => {
    ui.updateUserProfileUIForLogout();
  }).catch(error => {
    console.error('UI 모듈 로드 실패:', error);
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
