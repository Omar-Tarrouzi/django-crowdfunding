import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import NewHeader from './components/NewHeader';
import Footer from './components/Footer';
import Home from './screens/Home';
import Login from './screens/Login';
import ProjectDetail from './screens/ProjectDetail';
import Donate from './screens/Donate';
import FavoriteProjects from './components/FavoriteProjects';
import AdminDashboard from './screens/AdminDashboard';
import AccountSettings from './screens/AccountSettings';
import SignUp from './screens/SignUp';
import Logout from './screens/Logout';
import CreatorDashboard from './screens/CreatorDashboard';
import EditProject from './screens/EditProject';
import CreateProject from './screens/CreateProject';
import 'bootstrap/dist/css/bootstrap.min.css';
import PrivateRoute from './components/PrivateRoute';
import DonateForm from './components/DonateForm';
import FavoriteButton from './components/FavoriteButton';
import DonationHistory from './components/DonationHistory';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <NewHeader />
          <main className="flex-grow-1">
            <Container maxWidth={false} disableGutters>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/project/:projectId" element={<ProjectDetail />} />
                <Route path="/project/:id/donate" element={<Donate />} />
                <Route path="/favorites" element={<FavoriteProjects />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/account" element={<AccountSettings />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/projects" element={<CreatorDashboard />} />
                <Route path="/projects/create" element={<CreateProject />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/projects/:id/edit" element={<EditProject />} />
                <Route path="/donate/:projectId" element={
                  <PrivateRoute>
                    <DonateForm />
                  </PrivateRoute>
                } />
                <Route path="/donations/history" element={<DonationHistory />} />
              </Routes>
            </Container>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
