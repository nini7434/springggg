// main.js - 웹사이트 메인 스크립트

// 모듈 임포트
import { app } from './firebase-config.js';
import { initializeUI } from './ui.js';
import { setupAuthStateObserver, setupAuthEventListeners } from './auth-handler.js';

// Kakao SDK 초기화
function initializeKakao() {
  if (typeof Kakao !== 'undefined') {
    if (!Kakao.isInitialized()) {
      Kakao.init('9bd5d7401c90c3e6435c23a3cbb46272');
      console.log('카카오 SDK 초기화 상태:', Kakao.isInitialized());
    }
  } else {
    console.error('카카오 SDK가 로드되지 않았습니다');
  }
}

// 웹사이트 초기화 함수
function initializeWebsite() {
  // UI 초기화
  initializeUI();
  
  // 카카오 SDK 초기화
  initializeKakao();
  
  // Firebase 인증 상태 관찰자 설정
  setupAuthStateObserver();
  
  // Firebase 인증 이벤트 리스너 설정
  setupAuthEventListeners();
  
  console.log('웹사이트가 초기화되었습니다.');
}

// DOM이 로드되면 웹사이트 초기화
document.addEventListener('DOMContentLoaded', initializeWebsite);

// 카카오 로그인 핸들러 (파일 모듈화가 완료되면 auth-handler.js로 이동할 수 있음)
export function handleKakaoLogin() {
  console.log('카카오 로그인 버튼 클릭됨');
  if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
    alert('카카오 SDK가 초기화되지 않았습니다');
    return;
  }
  
  Kakao.Auth.login({
    success: function(authObj) {
      // 카카오 사용자 정보 요청
      Kakao.API.request({
        url: '/v2/user/me',
        success: function(res) {
          console.log('카카오 로그인 성공:', res);
          alert(`카카오 로그인 성공: ${res.properties.nickname}님 환영합니다!`);
          const loginModal = document.getElementById('loginModal');
          if (loginModal) loginModal.classList.add('hidden');
          // Firebase 커스텀 인증이 필요합니다 (별도 서버 필요)
        },
        fail: function(error) {
          console.error('카카오 사용자 정보 요청 실패:', error);
          alert('사용자 정보를 가져오는데 실패했습니다');
        }
      });
    },
    fail: function(err) {
      console.error('카카오 로그인 실패:', err);
      alert('카카오 로그인에 실패했습니다');
    }
  });
}

// 전역 변수로 노출 (필요한 경우)
window.handleKakaoLogin = handleKakaoLogin;
