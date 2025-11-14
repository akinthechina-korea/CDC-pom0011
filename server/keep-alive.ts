// Keep-Alive 스크립트: Render 무료 플랜의 슬리프 모드 방지
// 프로덕션 환경에서만 주기적으로 서버에 요청을 보내서 서버를 깨어있게 유지

export function startKeepAlive(baseUrl: string = '') {
  // 프로덕션 환경에서만 작동
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // baseUrl이 없으면 환경 변수에서 가져오기
  const url = baseUrl || process.env.RENDER_EXTERNAL_URL || process.env.KEEP_ALIVE_URL || '';
  
  if (!url) {
    console.log('⚠️ Keep-Alive: URL이 설정되지 않아 비활성화됩니다.');
    console.log('💡 RENDER_EXTERNAL_URL 또는 KEEP_ALIVE_URL 환경 변수를 설정하세요.');
    return;
  }

  console.log(`✅ Keep-Alive 활성화: ${url} (14분마다 핑)`);

  // 14분마다 요청 (15분 슬리프 모드 전에 깨우기)
  const interval = 14 * 60 * 1000; // 14분 = 840,000ms

  const ping = async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Keep-Alive-Bot/1.0',
        },
      });
      
      if (response.ok) {
        console.log(`✅ Keep-Alive: 서버 응답 확인 (${new Date().toLocaleTimeString()})`);
      } else {
        console.log(`⚠️ Keep-Alive: 서버 응답 ${response.status}`);
      }
    } catch (error: any) {
      // 에러가 발생해도 메인 서버에 영향 없도록 조용히 처리
      console.log(`⚠️ Keep-Alive: 요청 실패 (에러가 발생해도 서버는 정상 작동) - ${error.message}`);
    }
  };

  // 첫 핑은 서버 시작 후 1분 후에 (서버가 완전히 시작된 후)
  setTimeout(() => {
    ping();
    // 이후 주기적으로 핑
    setInterval(ping, interval);
  }, 60 * 1000); // 1분 후 첫 핑

  console.log('📡 Keep-Alive가 시작되었습니다. 서버가 슬리프 모드로 들어가지 않습니다.');
}

