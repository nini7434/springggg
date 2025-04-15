// 카카오 초기화 함수 업데이트
export function initializeKakao() {
  if (typeof Kakao !== 'undefined') {
    if (!Kakao.isInitialized()) {
      // 실제 카카오 JavaScript 키가 맞는지 확인하세요
      Kakao.init('9bd5d7401c90c3e6435c23a3cbb46272');
      console.log('카카오 SDK 초기화 상태:', Kakao.isInitialized());
    }
  } else {
    console.error('카카오 SDK가 로드되지 않았습니다');
  }
}

// 카카오 로그인 처리 함수 추가
export function handleKakaoLogin() {
  console.log('카카오 로그인 버튼 클릭됨');
  
  if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
    alert('카카오 SDK가 초기화되지 않았습니다');
    return;
  }
  
  // 카카오 로그인 팝업 열기
  Kakao.Auth.login({
    // 필요한 동의 항목 설정
    scope: 'profile_nickname, profile_image, account_email',
    // 동의 화면 항상 표시 설정
    throughTalk: false,  // 카카오톡이 아닌 웹 페이지에서 로그인 진행
    persistAccessToken: true, // 액세스 토큰 유지
    success: function(authObj) {
      console.log('카카오 로그인 성공:', authObj);
      
      // 사용자 정보 요청
      Kakao.API.request({
        url: '/v2/user/me',
        success: function(res) {
          console.log('카카오 사용자 정보:', res);
          
          const nickname = res.properties?.nickname || '';
          const profileImage = res.properties?.profile_image || '';
          const email = res.kakao_account?.email || '';
          
          // 로그인 완료
          completeLogin(res.id, nickname, email, profileImage);
        },
        fail: function(error) {
          console.error('카카오 사용자 정보 요청 실패:', error);
          alert('사용자 정보를 가져오는데 실패했습니다.');
        }
      });
    },
    fail: function(err) {
      console.error('카카오 로그인 실패:', err);
      alert('카카오 로그인에 실패했습니다.');
    }
  });
}

// 로그인 완료 헬퍼 함수 추가
export function completeLogin(userId, nickname, email, profileImage) {
  // 1. 성공 메시지 표시
  alert(`${nickname}님, 환영합니다!`);
  
  // 2. UI 업데이트
  updateUserProfileUI(nickname, profileImage);
  
  // 3. 로그인 상태 저장 (localStorage)
  localStorage.setItem('currentUser', JSON.stringify({
    id: userId,
    nickname: nickname,
    profileImage: profileImage,
    email: email,
    provider: 'kakao',
    loginTime: new Date().toISOString()
  }));
  
  // 4. 로그인 모달 닫기
  const loginModal = document.getElementById('loginModal');
  if (loginModal) loginModal.classList.add('hidden');
}
