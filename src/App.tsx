import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { AuthForm } from './components/auth/AuthForm';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Stocks } from './pages/Stocks';
import { TradingDesk } from './pages/TradingDesk';
import { Tasks } from './pages/Tasks';
import { Calendar } from './pages/Calendar';
import { Forecasting } from './pages/Forecasting';
import { Retrospective } from './pages/Retrospective';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Simulation } from './pages/Simulation';
import { StrategicBrain } from './pages/StrategicBrain';
import { IndexEditor } from './pages/IndexEditor';
import { Notes } from './pages/Notes';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <Router>
          <div className="min-h-screen text-gray-100">
            <div className="flex">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 overflow-auto p-4 perspective-container">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/stocks" element={<Stocks />} />
                    <Route path="/trading-desk" element={<TradingDesk />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/forecasting" element={<Forecasting />} />
                    <Route path="/retrospective" element={<Retrospective />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/simulation" element={<Simulation />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/strategic-brain" element={<StrategicBrain />} />
                    <Route path="/index-editor" element={<IndexEditor />} />
                    <Route path="/notes" element={<Notes />} />
                  </Routes>
                </main>
              </div>
            </div>
          </div>
        </Router>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;