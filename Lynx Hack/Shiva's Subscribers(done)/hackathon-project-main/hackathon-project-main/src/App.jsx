import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Pages
import ScanDashboard from './pages/ScanDashboard';
import AiAssistant from './pages/AiAssistant';
import AlternativeSwipeDeck from './pages/AlternativeSwipeDeck';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';

// Components
import Sidebar from './components/Sidebar';
import FloatingChat from './components/FloatingChat';

function AppLayout({ children }) {
  const location = useLocation();
  const isSetup = location.pathname === '/';

  if (isSetup) {
    return <main>{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden text-white relative bg-[#0d1117]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
         {/* Global Glowing Backgrounds for the content area */}
         <div className="fixed top-20 right-20 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse"></div>
         <div className="fixed bottom-20 left-20 w-[400px] h-[400px] bg-[#00f2fe]/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
         
         {children}
      </main>
      <FloatingChat />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/scan" element={<ScanDashboard />} />
          <Route path="/chat" element={<AiAssistant />} />
          <Route path="/alternatives" element={<AlternativeSwipeDeck />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
