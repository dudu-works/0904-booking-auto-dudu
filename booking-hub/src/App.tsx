import { useState, useEffect } from 'react';
import { BookingTable } from './components/BookingTable';
import { BookingForm } from './components/BookingForm';
import { StatCards } from './components/StatCards';
import { UserProfile } from './components/UserProfile';
import { LoginPage } from './components/LoginPage';
import { AccessDenied } from './components/AccessDenied';
import { StatusBoard } from './components/StatusBoard';
import { supabase } from './lib/supabaseClient';
import { isAdmin, getCurrentUserEmail } from './lib/adminCheck';

type TabType = '대시보드' | '예약목록' | '예약추가' | '상태관리' | '위치확인';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('대시보드');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthAndAdmin = async () => {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setIsLoggedIn(true);
        const email = data.user.email;
        if (email) {
          const admin = await isAdmin(email);
          setIsAdminUser(admin);
        }
      } else {
        setIsLoggedIn(false);
        setIsAdminUser(false);
      }
      setLoading(false);
    };

    checkAuthAndAdmin();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setIsAdminUser(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleFormSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setActiveTab('예약목록');
  };

  const handleTableRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleLogout = () => {
    window.location.reload();
  };

  const tabs: { id: TabType; name: string; adminOnly?: boolean }[] = [
    { id: '대시보드', name: '대시보드' },
    { id: '예약목록', name: '예약목록' },
    { id: '예약추가', name: '예약추가' },
    { id: '상태관리', name: '미확정 관리', adminOnly: true },
    { id: '위치확인', name: '위치확인', adminOnly: true },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdminUser);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  if (!isAdminUser) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">예약 관리 허브</h1>
            {isAdminUser && (
              <p className="text-xs text-green-600 mt-1">관리자 모드</p>
            )}
          </div>
          <UserProfile onLogout={handleLogout} />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="p-8 pb-32">
        <div className="max-w-6xl mx-auto">
          {activeTab === '대시보드' && (
            <div>
              <StatCards refreshKey={refreshKey} />
            </div>
          )}

          {activeTab === '예약목록' && (
            <div>
              <BookingTable refreshKey={refreshKey} onRefresh={handleTableRefresh} />
            </div>
          )}

          {activeTab === '예약추가' && (
            <div>
              <BookingForm onSuccess={handleFormSuccess} isAdmin={isAdminUser} />
            </div>
          )}

          {activeTab === '상태관리' && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800">미확정 관리</h2>
                <p className="text-gray-600 mt-2">대기/검토/거절/질문 상태의 예약을 확인하고 관리합니다</p>
              </div>
              <StatusBoard refreshKey={refreshKey} onRefresh={handleTableRefresh} />
            </div>
          )}

          {activeTab === '위치확인' && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800">위치 확인</h2>
                <p className="text-gray-600 mt-2">주소를 클릭하면 Google Maps에서 열립니다</p>
              </div>
              <BookingTable refreshKey={refreshKey} onRefresh={handleTableRefresh} />
            </div>
          )}
        </div>
      </div>

      {/* 하단 탭 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
        <div className="max-w-6xl mx-auto flex">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-center font-semibold transition ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
