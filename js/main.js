// main.js - 완전히 단순화된 카카오 로그인 함수
export async function handleKakaoLogin() {
  console.log('카카오 로그인 버튼 클릭됨');
  
  if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
    alert('카카오 SDK가 초기화되지 않았습니다');
    return;
  }
  
  try {
    // 카카오 로그인 진행
    const authObj = await new Promise((resolve, reject) => {
      Kakao.Auth.login({
        success: (authObj) => {
          console.log('카카오 로그인 성공:', authObj);
          resolve(authObj);
        },
        fail: (error) => {
          console.error('카카오 로그인 실패:', error);
          reject(error);
        }
      });
    });
    
    // 카카오 사용자 정보 요청
    const userInfo = await new Promise((resolve, reject) => {
      Kakao.API.request({
        url: '/v2/user/me',
        success: (res) => {
          console.log('카카오 사용자 정보:', res);
          resolve(res);
          
          // 사용자 정보 표시
          const nickname = res.properties?.nickname || '사용자';
          alert(`${nickname}님, 카카오 로그인에 성공했습니다!`);
          
          // 로그인 모달 닫기
          const loginModal = document.getElementById('loginModal');
          if (loginModal) loginModal.classList.add('hidden');
        },
        fail: (error) => {
          console.error('사용자 정보 요청 실패:', error);
          reject(error);
        }
      });
    });
    
  } catch (error) {
    console.error('카카오 로그인 처리 중 에러 발생:', error);
    alert('로그인 처리 중 오류가 발생했습니다.');
  }
}
