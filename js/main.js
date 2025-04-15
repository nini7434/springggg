// main.js에서 카카오 로그인 함수 전체 교체
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
        success: (authObj) => resolve(authObj),
        fail: (error) => reject(error)
      });
    });
    
    console.log('카카오 로그인 성공:', authObj);
    
    // 카카오 사용자 정보 요청
    const kakaoUserInfo = await new Promise((resolve, reject) => {
      Kakao.API.request({
        url: '/v2/user/me',
        success: (res) => resolve(res),
        fail: (error) => reject(error)
      });
    });
    
    console.log('카카오 사용자 정보:', kakaoUserInfo);
    
    // 필요한 정보 추출
    const kakaoId = kakaoUserInfo.id.toString();
    const nickname = kakaoUserInfo.properties?.nickname || '사용자';
    const profileImage = kakaoUserInfo.properties?.profile_image || '';
    const email = kakaoUserInfo.kakao_account?.email || `kakao_${kakaoId}@example.com`;
    
    // Firebase에 이메일/비밀번호로 로그인 시도
    // (이미 가입된 사용자인 경우 로그인, 아닌 경우 가입 후 로그인)
    try {
      const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
      const auth = getAuth();
      
      // 이메일 로그인 시도
      await signInWithEmailAndPassword(auth, email, `kakao_secret_${kakaoId}`);
      console.log('기존 사용자 로그인 성공');
      
    } catch (loginError) {
      // 로그인 실패 시 (사용자가 없는 경우) 회원가입 진행
      if (loginError.code === 'auth/user-not-found') {
        try {
          const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
          const auth = getAuth();
          
          // 새 계정 생성
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            email, 
            `kakao_secret_${kakaoId}`
          );
          
          // 프로필 정보 업데이트
          await updateProfile(userCredential.user, {
            displayName: nickname,
            photoURL: profileImage
          });
          
          // Firestore에 사용자 정보 저장
          const { getFirestore, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
          const db = getFirestore();
          await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            displayName: nickname,
            email: email,
            photoURL: profileImage,
            kakaoId: kakaoId,
            provider: 'kakao',
            createdAt: new Date(),
            lastLogin: new Date()
          });
          
          console.log('새 사용자 가입 및 로그인 성공');
          
        } catch (signUpError) {
          console.error('회원가입 에러:', signUpError);
          throw signUpError;
        }
      } else {
        console.error('로그인 에러:', loginError);
        throw loginError;
      }
    }
    
    // 로그인 성공 처리
    alert(`${nickname}님 환영합니다!`);
    
    // 로그인 모달 닫기
    const loginModal = document.getElementById('loginModal');
    if (loginModal) loginModal.classList.add('hidden');
    
  } catch (error) {
    console.error('카카오 로그인 처리 중 에러 발생:', error);
    alert('로그인 처리 중 오류가 발생했습니다.');
  }
}
