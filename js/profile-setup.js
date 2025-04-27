// profile-setup.js - 프로필 설정 페이지 기능

import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
  // Firebase 인스턴스 가져오기
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  
  // 사용자 인증 상태 확인
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('로그인 상태:', user.uid);
      // 기존 프로필 정보 불러오기
      loadUserProfile(user.uid);
    } else {
      console.log('로그아웃 상태');
      // 로그인 페이지로 리디렉션
      window.location.href = 'index.html';
    }
  });
  
  // 연도 선택 옵션 채우기
  populateYearOptions('birthYear', 1950, new Date().getFullYear());
  populateYearOptions('encounterYear', 1990, new Date().getFullYear());
  
  // 폼 제출 이벤트 리스너
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', handleFormSubmit);
  }
  
  // 프로필 이미지 변경 이벤트 리스너
  const profileImageInput = document.getElementById('profileImage');
  if (profileImageInput) {
    profileImageInput.addEventListener('change', handleProfileImageChange);
  }
  
  // 초기화 완료
  console.log('프로필 설정 페이지 초기화 완료');
});

// 연도 선택 옵션 채우기 함수
function populateYearOptions(selectId, startYear, endYear) {
  const selectElement = document.getElementById(selectId);
  if (!selectElement) return;
  
  for (let year = endYear; year >= startYear; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    selectElement.appendChild(option);
  }
}

// 폼 제출 처리 함수
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // 제출 버튼 비활성화 (중복 제출 방지)
  const submitButton = e.target.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 저장 중...';
  }
  
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert('로그인이 필요합니다.');
      window.location.href = 'index.html';
      return;
    }
    
    // 폼 데이터 수집
    const formData = getFormData();
    
    // 필수 항목 검증
    if (!validateForm(formData)) {
      // 에러 메시지는 validateForm 내부에서 표시됨
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i data-lucide="check-circle" class="h-6 w-6 mr-2"></i> <span>서비스 이용하기</span>';
      }
      return;
    }
    
    // Firestore에 데이터 저장
    await saveProfileToFirestore(user.uid, formData);
    
    // 프로필 이미지가 있으면 Storage에 업로드
    if (formData.profileImage) {
      const imageUrl = await uploadProfileImage(user.uid, formData.profileImage);
      await updateProfileImage(user.uid, imageUrl);
    }
    
    // 성공 메시지 표시
    alert('프로필이 성공적으로 저장되었습니다.');
    
    // 메인 페이지로 리디렉션
    window.location.href = 'index.html';
    
  } catch (error) {
    console.error('프로필 저장 오류:', error);
    alert('프로필 저장 중 오류가 발생했습니다: ' + error.message);
    
    // 버튼 상태 복구
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i data-lucide="check-circle" class="h-6 w-6 mr-2"></i> <span>서비스 이용하기</span>';
    }
  }
}

// 폼 데이터 수집 함수
function getFormData() {
  return {
    // 내 정보
    displayName: document.getElementById('displayName')?.value || '',
    gender: document.querySelector('input[name="gender"]:checked')?.value || '',
    birthYear: document.getElementById('birthYear')?.value || '',
    location: document.getElementById('location')?.value || '',
    selfDescription: document.getElementById('selfDescription')?.value || '',
    
    // 프로필 이미지 (파일 입력이 있다면)
    profileImage: document.getElementById('profileImage')?.files[0] || null,
    
    // 찾는 인연 정보
    encounterYear: document.getElementById('encounterYear')?.value || '',
    encounterRegion: document.getElementById('encounterRegion')?.value || '',
    encounterLocationDetail: document.getElementById('encounterLocationDetail')?.value || '',
    encounterSituation: document.getElementById('encounterSituation')?.value || '',
    personDescription: document.getElementById('personDescription')?.value || '',
    message: document.getElementById('message')?.value || '',
    
    // 연락처 정보
    phoneNumber: document.getElementById('phoneNumber')?.value || '',
    socialMedia: document.getElementById('socialMedia')?.value || '',
    
    // 메타데이터
    updatedAt: serverTimestamp(),
    profileCompleted: true
  };
}

// 폼 유효성 검사 함수
function validateForm(formData) {
  // 필수 항목 확인 목록
  const requiredFields = [
    { field: 'displayName', name: '이름/닉네임' },
    { field: 'gender', name: '성별' },
    { field: 'birthYear', name: '출생 연도' },
    { field: 'location', name: '현재 거주 지역' }
  ];
  
  // 하나라도 누락된 필수 항목이 있는지 확인
  for (const {field, name} of requiredFields) {
    if (!formData[field]) {
      alert(`${name}을(를) 입력해주세요.`);
      const inputElement = document.getElementById(field);
      if (inputElement) {
        inputElement.focus();
        // 시각적 피드백 (빨간 테두리 효과)
        inputElement.classList.add('border-red-500', 'ring-1', 'ring-red-500');
        // 2초 후 효과 제거
        setTimeout(() => {
          inputElement.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
        }, 2000);
      }
      return false;
    }
  }
  
  // 자신에 대한 설명 최소 길이 확인
  if (formData.selfDescription.length < 20) {
    alert('나의 외모/특징은 최소 20자 이상 입력해주세요.');
    const inputElement = document.getElementById('selfDescription');
    if (inputElement) {
      inputElement.focus();
      inputElement.classList.add('border-red-500', 'ring-1', 'ring-red-500');
      setTimeout(() => {
        inputElement.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
      }, 2000);
    }
    return false;
  }
  
  // 핸드폰 번호 형식 확인 (입력된 경우)
  if (formData.phoneNumber && !/^01[016789]\d{7,8}$/.test(formData.phoneNumber.replace(/-/g, ''))) {
    alert('올바른 핸드폰 번호 형식이 아닙니다. "-" 없이 숫자만 입력해주세요.');
    const inputElement = document.getElementById('phoneNumber');
    if (inputElement) {
      inputElement.focus();
      inputElement.classList.add('border-red-500', 'ring-1', 'ring-red-500');
      setTimeout(() => {
        inputElement.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
      }, 2000);
    }
    return false;
  }
  
  return true;
}

// Firestore에 프로필 저장 함수
async function saveProfileToFirestore(userId, profileData) {
  const db = getFirestore();
  
  // 이미지 파일 객체는 제외하고 저장
  const { profileImage, ...dataToSave } = profileData;
  
  try {
    // users 컬렉션에 저장
    await setDoc(doc(db, "users", userId), dataToSave, { merge: true });
    console.log('프로필 정보 저장 완료');
    
    // 인연 찾기 정보가 있으면 connections 컬렉션에도 저장
    if (profileData.encounterYear && profileData.encounterRegion) {
      // 기본 연결 데이터
      const connectionData = {
        userId,
        displayName: profileData.displayName,
        gender: profileData.gender,
        encounterYear: profileData.encounterYear,
        encounterRegion: profileData.encounterRegion,
        encounterLocationDetail: profileData.encounterLocationDetail,
        encounterSituation: profileData.encounterSituation,
        personDescription: profileData.personDescription,
        message: profileData.message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active' // active, matched, closed
      };
      
      // 사용자별 connections 컬렉션에 저장
      await setDoc(doc(db, "connections", `${userId}_${profileData.encounterYear}_${Date.now()}`), connectionData);
      console.log('인연 찾기 정보 저장 완료');
    }
    
    return true;
  } catch (error) {
    console.error('Firestore 저장 오류:', error);
    throw error;
  }
}

// 프로필 이미지 업로드 함수
async function uploadProfileImage(userId, imageFile) {
  if (!imageFile) return null;
  
  const storage = getStorage();
  const imageRef = ref(storage, `profile_images/${userId}_${Date.now()}`);
  
  try {
    // 이미지 업로드
    const snapshot = await uploadBytes(imageRef, imageFile);
    console.log('이미지 업로드 완료:', snapshot);
    
    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(imageRef);
    console.log('이미지 URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    throw error;
  }
}

// 프로필 이미지 URL 업데이트 함수
async function updateProfileImage(userId, imageUrl) {
  if (!imageUrl) return;
  
  const db = getFirestore();
  
  try {
    await setDoc(doc(db, "users", userId), {
      profileImage: imageUrl,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('프로필 이미지 URL 업데이트 완료');
  } catch (error) {
    console.error('프로필 이미지 URL 업데이트 오류:', error);
    throw error;
  }
}

// 기존 프로필 정보 불러오기 함수
async function loadUserProfile(userId) {
  const db = getFirestore();
  
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('사용자 프로필 데이터:', userData);
      
      // 폼에 데이터 채우기
      fillFormWithUserData(userData);
    } else {
      console.log('신규 사용자: 프로필 정보 없음');
    }
  } catch (error) {
    console.error('프로필 정보 불러오기 오류:', error);
  }
}

// 사용자 데이터로 폼 채우기
function fillFormWithUserData(userData) {
  // 텍스트 입력 필드
  const textFields = [
    'displayName', 'birthYear', 'location', 'selfDescription',
    'encounterYear', 'encounterRegion', 'encounterLocationDetail',
    'encounterSituation', 'personDescription', 'message',
    'phoneNumber', 'socialMedia'
  ];
  
  textFields.forEach(field => {
    const element = document.getElementById(field);
    if (element && userData[field]) {
      element.value = userData[field];
    }
  });
  
  // 라디오 버튼 (성별)
  if (userData.gender) {
    const genderRadio = document.querySelector(`input[name="gender"][value="${userData.gender}"]`);
    if (genderRadio) {
      genderRadio.checked = true;
    }
  }
  
  // 프로필 이미지 (있는 경우)
  if (userData.profileImage) {
    displayProfileImage(userData.profileImage);
  }
}

// 프로필 이미지 변경 처리 함수
function handleProfileImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // 파일 유형 검사
  if (!file.type.match('image.*')) {
    alert('이미지 파일만 업로드할 수 있습니다.');
    e.target.value = ''; // 입력 필드 초기화
    return;
  }
  
  // 파일 크기 검사 (2MB 제한)
  if (file.size > 2 * 1024 * 1024) {
    alert('2MB 이하의 이미지만 업로드할 수 있습니다.');
    e.target.value = ''; // 입력 필드 초기화
    return;
  }
  
  // 파일 미리보기
  const reader = new FileReader();
  reader.onload = function(event) {
    displayProfileImage(event.target.result);
  };
  reader.readAsDataURL(file);
}

// 프로필 이미지 표시 함수
function displayProfileImage(imageUrl) {
  const profileImagePreview = document.getElementById('profileImagePreview');
  const profileImagePlaceholder = document.getElementById('profileImagePlaceholder');
  const profileImageDisplay = document.getElementById('profileImageDisplay');
  
  if (profileImageDisplay && profileImagePlaceholder && imageUrl) {
    // 이미지 표시
    profileImageDisplay.src = imageUrl;
    profileImageDisplay.classList.remove('hidden');
    
    // 플레이스홀더 숨기기
    profileImagePlaceholder.classList.add('hidden');
  }
}
