// profile-setup.js - 프로필 설정 페이지 관련 스크립트

document.addEventListener('DOMContentLoaded', function() {
  // 카카오 SDK 초기화
  initializeKakaoSDK();
  
  // 로컬 스토리지에서 사용자 정보 가져오기
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    // 로그인 정보가 없으면 로그인 페이지로 리다이렉션
    console.log('로그인 정보가 없습니다. 로그인 페이지로 이동합니다.');
    window.location.href = 'index.html';
    return;
  }
  
  const userInfo = JSON.parse(currentUser);
  console.log('현재 사용자 정보:', userInfo);
  
  // 사용자 정보로 폼 초기화
  initializeFormWithUserInfo(userInfo);
  
  // 폼 제출 이벤트 처리
  setupFormSubmission(userInfo);
  
  // 프로필 이미지 관련 이벤트 처리
  setupProfileImageHandling();
  
  // 나중에 설정하기 버튼 이벤트 처리
  setupSkipButton(userInfo);
});

// 카카오 SDK 초기화 함수
function initializeKakaoSDK() {
  // auth-handler.js에서 초기화 함수 가져오기 (필요한 경우)
  try {
    import('./auth-handler.js').then(authHandler => {
      authHandler.initializeKakao();
    }).catch(error => {
      console.error('카카오 SDK 초기화 모듈 로드 실패:', error);
    });
  } catch (error) {
    console.error('카카오 SDK 초기화 중 오류:', error);
  }
}

// 사용자 정보로 폼 초기화
function initializeFormWithUserInfo(userInfo) {
  // 프로필 이미지 설정
  const previewImg = document.getElementById('previewImg');
  if (userInfo.profileImage) {
    previewImg.src = userInfo.profileImage;
  } else {
    // 기본 이미지 설정
    previewImg.src = 'default-profile.png';
  }
  
  // 닉네임 설정
  const nicknameInput = document.getElementById('nickname');
  if (userInfo.nickname) {
    nicknameInput.value = userInfo.nickname;
  }
  
  // 성별 설정 (저장된 정보가 있는 경우)
  if (userInfo.gender) {
    document.getElementById('gender').value = userInfo.gender;
  }
  
  // 연령대 설정 (저장된 정보가 있는 경우)
  if (userInfo.ageRange) {
    document.getElementById('ageRange').value = userInfo.ageRange;
  }
  
  // 자기소개 설정 (저장된 정보가 있는 경우)
  if (userInfo.bio) {
    document.getElementById('bio').value = userInfo.bio;
  }
}

// 폼 제출 이벤트 설정
function setupFormSubmission(userInfo) {
  const profileForm = document.getElementById('profileForm');
  
  profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 필수 입력값 검증
    const nickname = document.getElementById('nickname').value.trim();
    if (!nickname) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    
    // 업데이트된 사용자 정보 객체 생성
    const updatedUserInfo = {
      ...userInfo,
      nickname: nickname,
      gender: document.getElementById('gender').value,
      ageRange: document.getElementById('ageRange').value,
      bio: document.getElementById('bio').value,
      profileCompleted: true, // 프로필 설정 완료 표시
      updatedAt: new Date().toISOString()
    };
    
    // 로컬 스토리지에 업데이트된 정보 저장
    localStorage.setItem('currentUser', JSON.stringify(updatedUserInfo));
    
    console.log('프로필 정보가 업데이트되었습니다:', updatedUserInfo);
    
    // Firebase에 프로필 정보 저장 (실제 구현 시)
    // saveProfileToFirebase(updatedUserInfo);
    
    alert('프로필이 저장되었습니다.');
    
    // 메인 페이지로 이동
    window.location.href = 'index.html';
  });
}

// 프로필 이미지 관련 이벤트 설정
function setupProfileImageHandling() {
  const changeProfileImageBtn = document.getElementById('changeProfileImageBtn');
  const profileImageInput = document.getElementById('profileImageInput');
  const previewImg = document.getElementById('previewImg');
  
  // 이미지 변경 버튼 클릭 시 파일 선택 다이얼로그 열기
  changeProfileImageBtn.addEventListener('click', function() {
    profileImageInput.click();
  });
  
  // 파일 선택 시 이미지 미리보기
  profileImageInput.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 파일 크기 검증 (5MB 이하)
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      // 파일 타입 검증 (이미지만)
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 선택할 수 있습니다.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        previewImg.src = e.target.result;
        
        // 이미지를 로컬 스토리지에 저장 (실제로는 Firebase Storage에 업로드)
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        currentUser.profileImage = e.target.result;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      };
      
      reader.readAsDataURL(file);
    }
  });
}

// 나중에 설정하기 버튼 이벤트 설정
function setupSkipButton(userInfo) {
  const skipProfileSetup = document.getElementById('skipProfileSetup');
  
  skipProfileSetup.addEventListener('click', function(e) {
    e.preventDefault();
    
    // 사용자 정보 업데이트 - 프로필 설정을 건너뛰었음을 표시
    const updatedUserInfo = {
      ...userInfo,
      profilePrompted: true,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(updatedUserInfo));
    console.log('프로필 설정을 건너뛰었습니다');
    
    // 메인 페이지로 이동
    window.location.href = 'index.html';
  });
}

// Firebase에 프로필 저장 (실제 구현 시 사용)
function saveProfileToFirebase(userInfo) {
  // Firebase Firestore에 프로필 정보 저장
  // 실제 구현 시 Firebase SDK 사용
  console.log('Firebase에 프로필 저장 예정:', userInfo);
}
