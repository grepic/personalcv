import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import PostDetail from './pages/PostDetail';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import CompanyJobs from './pages/CompanyJobs';
import CreateJob from './pages/CreateJob';
import CandidateView from './pages/CandidateView';
import ProfileEdit from './pages/ProfileEdit';
import Search from './pages/Search';
import Network from './pages/Network';
import DynamicPage from './pages/DynamicPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import SeoSettings from './pages/Admin/SeoSettings';
import PageEditor from './pages/Admin/PageEditor';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function App() {
  const { loadUser, isLoading } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Feed />} />
          <Route path="feed" element={<Feed />} />
          <Route path="posts/:postId" element={<PostDetail />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:jobId" element={<JobDetail />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="profile/edit" element={<ProfileEdit />} />
          <Route path="messages" element={<Messages />} />
          <Route path="network" element={<Network />} />
          <Route path="settings" element={<Settings />} />
          <Route path="search" element={<Search />} />
          <Route path="company/jobs" element={<CompanyJobs />} />
          <Route path="company/jobs/create" element={<CreateJob />} />
          <Route path="candidates/:candidateId" element={<CandidateView />} />

          {/* Admin Routes */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/seo" element={<SeoSettings />} />
          <Route path="admin/pages" element={<PageEditor />} />

          {/* Dynamic CMS Pages */}
          <Route path="pages/:slug" element={<DynamicPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
