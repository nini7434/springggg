// find-me.js - 나를 찾는 사람 페이지 기능

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy, 
  limit,
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 전역 변수
let currentUser = null;
let userProfile = null;
let allConnections = [];
let filteredConnections = [];

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
      
      // 사용자 프로필 로드 후, 매칭 데이터 로드
      loadUserProfile(user.uid).then(() => {
        loadMatchingConnections();
      });
      
      // 필터링 및 모달 이벤트 리스너 설정
      setupEventListeners();
    } else {
      console.log('로그아웃 상태');
      // 로그인 페이지로 리디렉션
      window.location.href = 'index.html';
    }
  });
});

// 사용자 프로필 로드
async function loadUserProfile(userId) {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      userProfile = userDoc.data();
      console.log('사용자 프로필 로드됨:', userProfile);
      
      // 연도 필터 옵션 생성
      populateYearOptions();
      
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

// 연도 필터 옵션 채우기
function populateYearOptions() {
  const filterYear = document.getElementById('filterYear');
  if (!filterYear) return;
  
  const currentYear = new Date().getFullYear();
  const startYear = 1990;
  
  for (let year = currentYear; year >= startYear; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year + '년';
    filterYear.appendChild(option);
  }
}

// 매칭 가능한 연결 데이터 로드
async function loadMatchingConnections() {
  if (!userProfile) return;
  
  try {
    const db = getFirestore();
    const connectionsRef = collection(db, "connections");
    
    // 로딩 표시
    showLoadingIndicator(true);
    
    // 기본 필터링: 활성 상태의 연결만
    let matchingQuery = query(
      connectionsRef,
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(matchingQuery);
    
    // 모든 연결 데이터 임시 저장
    allConnections = [];
    querySnapshot.forEach((doc) => {
      const connectionData = doc.data();
      connectionData.id = doc.id;
      
      // 자신이 작성한 글은 제외
      if (connectionData.userId !== currentUser.uid) {
        allConnections.push(connectionData);
      }
    });
    
    console.log('불러온 연결 데이터:', allConnections.length);
    
    // 기본 필터 적용 (사용자 정보 기반)
    applyFilters();
    
  } catch (error) {
    console.error('매칭 데이터 로드 오류:', error);
    showErrorMessage('데이터를 불러오는 중 오류가 발생했습니다.');
  } finally {
    showLoadingIndicator(false);
  }
}

// 필터 적용
function applyFilters() {
  const filterRegion = document.getElementById('filterRegion').value;
  const filterYear = document.getElementById('filterYear').value;
  const filterKeyword = document.getElementById('filterKeyword').value.toLowerCase().trim();
  
  // 모든 연결 데이터에서 필터링
  filteredConnections = allConnections.filter(connection => {
    // 지역 필터
    if (filterRegion && connection.encounterRegion !== filterRegion) {
      return false;
    }
    
    // 연도 필터
    if (filterYear && connection.encounterYear !== filterYear) {
      return false;
    }
    
    // 키워드 필터 (상세 장소, 상황 설명, 인물 설명에서 검색)
    if (filterKeyword) {
      const locationMatch = connection.encounterLocationDetail && 
                           connection.encounterLocationDetail.toLowerCase().includes(filterKeyword);
      const situationMatch = connection.encounterSituation && 
                            connection.encounterSituation.toLowerCase().includes(filterKeyword);
      const personMatch = connection.personDescription && 
                         connection.personDescription.toLowerCase().includes(filterKeyword);
      
      if (!(locationMatch || situationMatch || personMatch)) {
        return false;
      }
    }
    
    return true;
  });
  
  // 매칭 점수 계산 및 정렬
  filteredConnections.forEach(connection => {
    connection.matchScore = calculateMatchScore(connection);
  });
  
  filteredConnections.sort((a, b) => b.matchScore - a.matchScore);
  
  // 화면에 표시
  displayMatchResults();
}

// 매칭 점수 계산 (0-100)
function calculateMatchScore(connection) {
  if (!userProfile) return 0;
  
  let score = 0;
  let maxScore = 0;
  connection.matchPoints = [];
  
  // 1. 지역 일치 (20점)
  if (connection.encounterRegion === userProfile.location) {
    score += 20;
    connection.matchPoints.push({
      type: 'location',
      description: `거주 지역 '${userProfile.location}'이(가) 일치합니다.`
    });
  }
  maxScore += 20;
  
  // 2. 성별 일치 (20점) - connection의 personDescription에서 성별 키워드 확인
  if (userProfile.gender === 'male' && connection.personDescription && 
     (connection.personDescription.includes('남자') || 
      connection.personDescription.includes('남성'))) {
    score += 20;
    connection.matchPoints.push({
      type: 'gender',
      description: '찾는 사람의 성별과 일치합니다.'
    });
  } else if (userProfile.gender === 'female' && connection.personDescription && 
            (connection.personDescription.includes('여자') || 
             connection.personDescription.includes('여성'))) {
    score += 20;
    connection.matchPoints.push({
      type: 'gender',
      description: '찾는 사람의 성별과 일치합니다.'
    });
  }
  maxScore += 20;
  
  // 3. 외모/특징 키워드 일치 (최대 30점)
  if (userProfile.selfDescription && connection.personDescription) {
    // 사용자 특징에서 키워드 추출 (2글자 이상 단어)
    const userKeywords = extractKeywords(userProfile.selfDescription);
    
    // 연결 글의 인물 설명에서 찾기
    const matchedKeywords = userKeywords.filter(keyword => 
      connection.personDescription.includes(keyword)
    );
    
    // 최대 3개 키워드까지 각 10점씩
    const keywordScore = Math.min(3, matchedKeywords.length) * 10;
    score += keywordScore;
    
    if (matchedKeywords.length > 0) {
      connection.matchPoints.push({
        type: 'keywords',
        description: `외모/특징 키워드 ${matchedKeywords.length}개가 일치합니다: ${matchedKeywords.join(', ')}`
      });
    }
  }
  maxScore += 30;
  
  // 4. 연도 근접성 (최대 15점) - 출생연도와 만남 연도의 관계
  if (userProfile.birthYear && connection.encounterYear) {
    const userAgeAtEncounter = connection.encounterYear - userProfile.birthYear;
    
    // 연결 글에 나이 언급이 있는지 확인
    let mentionedAge = extractAgeFromDescription(connection.personDescription);
    
    if (mentionedAge > 0) {
      // 나이 차이가 2살 이내면 15점, 5살 이내면 10점, 10살 이내면 5점
      const ageDifference = Math.abs(userAgeAtEncounter - mentionedAge);
      
      if (ageDifference <= 2) {
        score += 15;
        connection.matchPoints.push({
          type: 'age',
          description: `당시 나이(${userAgeAtEncounter}세)가 정확히 일치합니다.`
        });
      } else if (ageDifference <= 5) {
        score += 10;
        connection.matchPoints.push({
          type: 'age',
          description: `당시 나이(${userAgeAtEncounter}세)가 유사합니다.`
        });
      } else if (ageDifference <= 10) {
        score += 5;
        connection.matchPoints.push({
          type: 'age',
          description: `당시 나이(${userAgeAtEncounter}세)와 가까운 편입니다.`
        });
      }
    }
  }
  maxScore += 15;
  
  // 5. 추가 설명 유사성 (최대 15점) - 머신러닝 없이 간단한 키워드 기반으로 계산
  // 향후 NLP 알고리즘으로 발전 가능
  if (userProfile.selfDescription && connection.personDescription) {
    // 기본적인 텍스트 길이 비교 (설명이 충분히 길면 가능성 증가)
    const userDescLength = userProfile.selfDescription.length;
    const connectionDescLength = connection.personDescription.length;
    
    if (userDescLength > 100 && connectionDescLength > 100) {
      score += 5;
      connection.matchPoints.push({
        type: 'description',
        description: '상세한 정보가 제공되었습니다.'
      });
    }
    
    // 간단한 감정 키워드 분석
    const emotionKeywords = ['웃음', '미소', '친절', '다정', '밝은', '조용', '차분', '활발'];
    let emotionMatches = 0;
    
    emotionKeywords.forEach(keyword => {
      if (userProfile.selfDescription.includes(keyword) && 
          connection.personDescription.includes(keyword)) {
        emotionMatches++;
      }
    });
    
    if (emotionMatches > 0) {
      const emotionScore = Math.min(emotionMatches * 5, 10);
      score += emotionScore;
      connection.matchPoints.push({
        type: 'emotion',
        description: `성격 및 분위기 묘사가 ${emotionMatches}개 일치합니다.`
      });
    }
  }
  maxScore += 15;
  
  // 최종 점수를 100점 만점으로 계산
  return Math.round((score / maxScore) * 100);
}

// 설명에서 키워드 추출 함수
function extractKeywords(text) {
  if (!text) return [];
  
  // 2음절 이상 단어만 추출 (한글)
  const keywords = [];
  const words = text.split(/\s+/);
  
  words.forEach(word => {
    // 특수문자 제거하고 순수 글자만
    const cleanWord = word.replace(/[^\uAC00-\uD7A3a-zA-Z0-9]/g, '');
    
    // 2글자 이상인 단어만 키워드로 간주
    if (cleanWord.length >= 2) {
      keywords.push(cleanWord);
    }
  });
  
  return keywords;
}

// 설명에서 나이 추출 함수
function extractAgeFromDescription(text) {
  if (!text) return 0;
  
  // "20대", "20살", "20세" 등의 패턴 찾기
  const agePatterns = [
    /(\d{1,2})대/,
    /(\d{1,2})살/,
    /(\d{1,2})세/,
    /(\d{1,2})[\s]*years?[\s]*old/i
  ];
  
  for (const pattern of agePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return 0;
}

// 매칭 결과 표시
function displayMatchResults() {
  const resultsContainer = document.getElementById('matchResultsContainer');
  const resultsCards = document.getElementById('matchResultsCards');
  const noResultsMessage = document.getElementById('noResultsMessage');
  
  // 카드 컨테이너 초기화
  resultsCards.innerHTML = '';
  
  if (filteredConnections.length === 0) {
    // 결과 없음 메시지 표시
    resultsCards.classList.add('hidden');
    noResultsMessage.classList.remove('hidden');
  } else {
    // 결과 카드 표시
    resultsCards.classList.remove('hidden');
    noResultsMessage.classList.add('hidden');
    
    // 각 연결에 대한 카드 생성
    filteredConnections.forEach(connection => {
      const card = createMatchCard(connection);
      resultsCards.appendChild(card);
    });
  }
}

// 매칭 카드 생성
function createMatchCard(connection) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl shadow-md overflow-hidden card-hover relative';
  card.dataset.connectionId = connection.id;
  
  // 매칭 점수 표시
  const matchPercent = document.createElement('div');
  matchPercent.className = 'match-percent';
  matchPercent.textContent = `${connection.matchScore}% 일치`;
  
  // 카드 내용
  card.innerHTML = `
    <div class="p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-1">${connection.displayName || '익명'}</h3>
      <p class="text-sm text-gray-500 mb-4">${connection.encounterYear}년 ${connection.encounterRegion} ${connection.encounterLocationDetail || ''}</p>
      
      <p class="text-gray-700 mb-4 line-clamp-3" title="${connection.encounterSituation || ''}">
        ${highlightMatchText(connection.encounterSituation || '상황 설명이 없습니다.', 120)}
      </p>
      
      <div class="flex justify-between items-center">
        <p class="text-xs text-gray-500">
          ${formatDate(connection.createdAt)} 등록
        </p>
        <button class="text-sm text-primary-600 hover:text-primary-800 flex items-center view-detail-btn">
          상세보기
          <i data-lucide="chevron-right" class="h-4 w-4 ml-1"></i>
        </button>
      </div>
    </div>
  `;
  
  // 매칭 점수 요소 추가
  card.appendChild(matchPercent);
  
  // 상세보기 클릭 이벤트
  card.querySelector('.view-detail-btn').addEventListener('click', () => {
    showConnectionDetail(connection);
  });
  
  // 카드 전체 클릭으로도 상세 보기 가능
  card.addEventListener('click', (e) => {
    // 이미 버튼 클릭이면 중복 실행 방지
    if (!e.target.closest('.view-detail-btn')) {
      showConnectionDetail(connection);
    }
  });
  
  return card;
}

// 텍스트 하이라이트 및 제한 함수
function highlightMatchText(text, maxLength) {
  if (!text) return '';
  
  // 텍스트 길이 제한
  let displayText = text;
  if (text.length > maxLength) {
    displayText = text.substring(0, maxLength) + '...';
  }
  
  // 향후: 매칭된 키워드 하이라이트 기능 추가 가능
  
  return displayText;
}

// 타임스탬프 포맷 함수
function formatDate(timestamp) {
  if (!timestamp) return '';
  
  let date;
  if (timestamp.seconds) {
    // Firestore Timestamp
    date = new Date(timestamp.seconds * 1000);
  } else {
    // 일반 Date 객체
    date = new Date(timestamp);
  }
  
  return `${date.getFullYear()}.${padZero(date.getMonth() + 1)}.${padZero(date.getDate())}`;
}

// 숫자 앞에 0 붙이기
function padZero(num) {
  return num < 10 ? '0' + num : num;
}

// 연결 상세 정보 표시
function showConnectionDetail(connection) {
  const modal = document.getElementById('matchDetailModal');
  
  // 모달 내용 채우기
  document.getElementById('modalTitle').textContent = '매칭 상세 정보';
  document.getElementById('modalPersonName').textContent = connection.displayName || '익명';
  document.getElementById('modalEncounterInfo').textContent = `${connection.encounterYear}년 ${connection.encounterRegion} ${connection.encounterLocationDetail || ''}`;
  document.getElementById('modalEncounterDetail').textContent = connection.encounterSituation || '상세 설명이 없습니다.';
  document.getElementById('modalPersonDescription').textContent = connection.personDescription || '설명이 없습니다.';
  document.getElementById('modalMessage').textContent = connection.message || '메시지가 없습니다.';
  document.getElementById('modalMatchScore').textContent = `일치율: ${connection.matchScore}%`;
  
  // 일치 포인트 목록 채우기
  const matchPointsList = document.getElementById('modalMatchPoints');
  matchPointsList.innerHTML = '';
  
  if (connection.matchPoints && connection.matchPoints.length > 0) {
    connection.matchPoints.forEach(point => {
      const li = document.createElement('li');
      li.className = 'flex items-start';
      li.innerHTML = `
        <i data-lucide="check-circle" class="h-4 w-4 text-primary-500 mr-2 mt-0.5"></i>
        <span>${point.description}</span>
      `;
      matchPointsList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = '일치 포인트가 없습니다.';
    matchPointsList.appendChild(li);
  }
  
  // 연결 버튼에 ID 저장
  const connectButton = document.getElementById('connectButton');
  connectButton.dataset.connectionId = connection.id;
  
  // 아이콘 초기화
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // 모달 표시
  modal.classList.remove('hidden');
}

// 로딩 표시기 토글
function showLoadingIndicator(show) {
  const loadingIndicator = document.getElementById('loadingIndicator');
  const resultsCards = document.getElementById('matchResultsCards');
  const noResultsMessage = document.getElementById('noResultsMessage');
  
  if (show) {
    loadingIndicator.classList.remove('hidden');
    resultsCards.classList.add('hidden');
    noResultsMessage.classList.add('hidden');
  } else {
    loadingIndicator.classList.add('hidden');
  }
}

// 오류 메시지 표시
function showErrorMessage(message) {
  const noResultsMessage = document.getElementById('noResultsMessage');
  const noResultsDescription = noResultsMessage.querySelector('p');
  
  if (noResultsDescription) {
    noResultsDescription.textContent = message;
  }
  
  const resultsCards = document.getElementById('matchResultsCards');
  resultsCards.classList.add('hidden');
  noResultsMessage.classList.remove('hidden');
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 필터 적용 버튼
  const filterButton = document.getElementById('filterButton');
  if (filterButton) {
    filterButton.addEventListener('click', applyFilters);
  }
  
  // 키워드 입력 엔터키 처리
  const keywordInput = document.getElementById('filterKeyword');
  if (keywordInput) {
    keywordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        applyFilters();
      }
    });
  }
  
  // 모달 닫기 버튼
  const closeModalBtn = document.getElementById('closeModalBtn');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  
  // 모달 외부 클릭 시 닫기
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
  }
  
  // 연결 버튼 클릭
  const connectButton = document.getElementById('connectButton');
  if (connectButton) {
    connectButton.addEventListener('click', handleConnect);
  }
}

// 모달 닫기
function closeModal() {
  const modal = document.getElementById('matchDetailModal');
  modal.classList.add('hidden');
}

// 연결 요청 처리
async function handleConnect() {
  const connectButton = document.getElementById('connectButton');
  const connectionId = connectButton.dataset.connectionId;
  
  if (!connectionId || !currentUser) {
    alert('연결 정보가 올바르지 않습니다.');
    return;
  }
  
  // 버튼 비활성화 및 로딩 표시
  connectButton.disabled = true;
  connectButton.innerHTML = '<span class="animate-pulse">처리 중...</span>';
  
  try {
    // Firestore에서 연결 정보 가져오기
    const db = getFirestore();
    const connectionDoc = await getDoc(doc(db, "connections", connectionId));
    
    if (!connectionDoc.exists()) {
      throw new Error('해당 연결 정보를 찾을 수 없습니다.');
    }
    
    const connectionData = connectionDoc.data();
    
    // 매칭 생성 - 프로토타입에서는 단순히 알림만 표시
    alert(`매칭 요청이 전송되었습니다. 상대방이 확인하면 연락처가 공개됩니다.\n\n이 기능은 아직 프로토타입 단계입니다.`);
    
    closeModal();
    
  } catch (error) {
    console.error('연결 처리 오류:', error);
    alert(`연결 처리 중 오류가 발생했습니다: ${error.message}`);
  } finally {
    // 버튼 상태 복구
    connectButton.disabled = false;
    connectButton.innerHTML = '<i data-lucide="heart" class="w-5 h-5 mr-2 inline-block"></i>나도 이 사람을 찾고 있어요';
    
    // 아이콘 새로고침
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}
