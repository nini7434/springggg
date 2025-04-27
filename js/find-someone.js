// find-someone.js - 인연 찾기 등록 기능

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 전역 변수
let currentUser = null;
let userProfile = null;

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
  // 아이콘 초기화
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Firebase 인스턴스
  const auth = getAuth();
  
  // 인증 상태 관찰자 설정
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('로그인 상태:', user.uid);
      currentUser = user;
      
      // 사용자 프로필 로드
      loadUserProfile(user.uid);
      
      // 폼 및 모달 이벤트 리스너 설정
      setupFormEventListeners();
    } else {
      console.log('로그아웃 상태');
      // 로그인 페이지로 리디렉션
      window.location.href = 'index.html';
    }
  });
  
  // 연도 선택 옵션 채우기
  populateYearOptions();
});

// 사용자 프로필 로드
async function loadUserProfile(userId) {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      userProfile = userDoc.data();
      console.log('사용자 프로필 로드됨:', userProfile);
      
      // 사용자 정보로 폼 일부 자동 완성
      prepopulateFormWithUserInfo();
      
      return true;
    } else {
      console.log('프로필 정보가 없습니다.');
      alert('프로필 설정을 먼저 완료해주세요.');
      window.location.href = 'profile-setup.html';
      return false;
    }
  } catch (error) {
    console.error('프로필 로드 오류:', error);
    return false;
  }
}

// 연도 선택 옵션 채우기
function populateYearOptions() {
  const encounterYearSelect = document.getElementById('encounterYear');
  if (!encounterYearSelect) return;
  
  const currentYear = new Date().getFullYear();
  const startYear = 1990;
  
  for (let year = currentYear; year >= startYear; year--) {
    const option = document.createElement('option');
    option.value = year.toString();
    option.textContent = year + '년';
    encounterYearSelect.appendChild(option);
  }
}

// 사용자 정보로 폼 자동 완성
function prepopulateFormWithUserInfo() {
  if (!userProfile) return;
  
  // 이 페이지에서는 사용자 정보로 자동 완성할 필드가 많지 않음
  // 필요시 추가 가능
}

// 폼 이벤트 리스너 설정
function setupFormEventListeners() {
  const findSomeoneForm = document.getElementById('findSomeoneForm');
  if (findSomeoneForm) {
    findSomeoneForm.addEventListener('submit', handleFormSubmit);
  }
  
  // 모달 닫기 버튼
  const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');
  if (closeSuccessModalBtn) {
    closeSuccessModalBtn.addEventListener('click', () => {
      const modal = document.getElementById('submitSuccessModal');
      if (modal) modal.classList.add('hidden');
    });
  }
}

// 폼 제출 처리
async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    window.location.href = 'index.html';
    return;
  }
  
  // 제출 버튼 비활성화 (중복 제출 방지)
  const submitButton = e.target.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="animate-pulse">처리 중...</span>';
  }
  
  try {
    // 폼 데이터 수집
    const formData = getFormData();
    
    // 필수 항목 검증은 HTML required 속성으로 처리
    
    // Firestore에 데이터 저장
    const connectionId = await saveConnectionToFirestore(formData);
    
    if (connectionId) {
      // 성공 모달 표시
      showSuccessModal();
    } else {
      throw new Error('데이터 저장에 실패했습니다.');
    }
    
  } catch (error) {
    console.error('인연 찾기 등록 오류:', error);
    alert(`등록 중 오류가 발생했습니다: ${error.message}`);
  } finally {
    // 버튼 상태 복구
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i data-lucide="search-check" class="h-6 w-6 mr-2"></i><span>인연 찾기 등록하기</span>';
      
      // 아이콘 새로고침
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }
}

// 폼 데이터 수집
function getFormData() {
  return {
    // 만남 정보
    encounterYear: document.getElementById('encounterYear')?.value || '',
    encounterMonth: document.getElementById('encounterMonth')?.value || '',
    encounterRegion: document.getElementById('encounterRegion')?.value || '',
    encounterLocationDetail: document.getElementById('encounterLocationDetail')?.value || '',
    encounterSituation: document.getElementById('encounterSituation')?.value || '',
    
    // 찾는 사람 정보
    personName: document.getElementById('personName')?.value || '',
    personGender: document.querySelector('input[name="personGender"]:checked')?.value || '',
    estimatedAge: document.getElementById('estimatedAge')?.value || '',
    meetingDuration: document.getElementById('meetingDuration')?.value || '',
    personDescription: document.getElementById('personDescription')?.value || '',
    interactionDetail: document.getElementById('interactionDetail')?.value || '',
    
    // 메시지
    message: document.getElementById('message')?.value || '',
    visibility: document.querySelector('input[name="visibility"]:checked')?.value || 'public',
    
    // 사용자 정보
    userId: currentUser?.uid || '',
    displayName: userProfile?.displayName || currentUser?.displayName || '익명',
    userGender: userProfile?.gender || '',
    userProfileImage: userProfile?.profileImage || currentUser?.photoURL || '',
    
    // 메타데이터
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'active', // active, matched, closed
    matchCount: 0,
    viewCount: 0
  };
}

// Firestore에 연결 정보 저장
async function saveConnectionToFirestore(connectionData) {
  try {
    const db = getFirestore();
    
    // 고유 ID 생성 (사용자ID_연도_타임스탬프)
    const connectionId = `${connectionData.userId}_${connectionData.encounterYear}_${Date.now()}`;
    
    // connections 컬렉션에 저장
    await setDoc(doc(db, "connections", connectionId), connectionData);
    
    // 사용자의 connections 서브컬렉션에도 저장 (내 등록글 조회용)
    await setDoc(doc(db, "users", connectionData.userId, "connections", connectionId), {
      connectionId,
      encounterYear: connectionData.encounterYear,
      encounterRegion: connectionData.encounterRegion,
      encounterLocationDetail: connectionData.encounterLocationDetail,
      personGender: connectionData.personGender,
      createdAt: connectionData.createdAt,
      status: connectionData.status
    });
    
    console.log('인연 찾기 등록 완료:', connectionId);
    return connectionId;
  } catch (error) {
    console.error('Firestore 저장 오류:', error);
    throw error;
  }
}

// 성공 모달 표시
function showSuccessModal() {
  const modal = document.getElementById('submitSuccessModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
  
  // 아이콘 초기화
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}
