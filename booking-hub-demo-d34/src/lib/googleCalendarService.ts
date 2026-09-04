const CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';
const GIS_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface CalendarEvent {
  customer: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  address: string;
}

// Google Identity Services 토큰 클라이언트 초기화
export function initializeGoogleIdentity(): Promise<void> {
  return new Promise((resolve, reject) => {
    // GIS 라이브러리 로드
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google?.accounts?.id) {
        resolve();
      } else {
        reject(new Error('Google Identity Services 로드 실패'));
      }
    };
    script.onerror = () => reject(new Error('Google Identity Services 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
}

// 브라우저에서 Calendar access token 받기
export async function getCalendarAccessToken(): Promise<string> {
  if (!GIS_CLIENT_ID) {
    throw new Error('VITE_GOOGLE_CLIENT_ID가 설정되지 않음');
  }

  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    console.warn('Google Identity Services 미초기화 - Calendar 등록 스킵됨');
    return '';
  }

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GIS_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/calendar',
      callback: (response: any) => {
        if (response.access_token) {
          resolve(response.access_token);
        } else {
          reject(new Error('Access token 획득 실패'));
        }
      },
    });

    // 사용자에게 권한 요청
    client.requestAccessToken({ prompt: 'consent' });
  });
}

// Google Calendar에 이벤트 추가
export async function addEventToCalendar(
  accessToken: string,
  booking: CalendarEvent
): Promise<any> {
  // 날짜와 시간을 ISO 8601 형식으로 변환
  const [year, month, day] = booking.date.split('-');
  const [hour, minute] = booking.time.split(':');
  const startDateTime = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`).toISOString();

  // 1시간 duration으로 설정
  const endTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000);
  const endDateTime = endTime.toISOString();

  const event = {
    summary: `${booking.service} - ${booking.customer}`,
    description: `고객: ${booking.customer}\n서비스: ${booking.service}\n주소: ${booking.address}`,
    location: booking.address,
    start: {
      dateTime: startDateTime,
      timeZone: 'Asia/Seoul',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Asia/Seoul',
    },
  };

  const response = await fetch(`${CALENDAR_API_URL}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Calendar API error: ${error.error?.message || response.statusText}`);
  }

  return await response.json();
}
