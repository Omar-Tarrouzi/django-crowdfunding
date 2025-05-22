import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './screens/Home';
import Login from './screens/Login';
import ProjectDetail from './screens/ProjectDetail';
import Donate from './screens/Donate';
import FavoriteProjects from './screens/FavoriteProjects';
import AdminDashboard from './screens/AdminDashboard';
import AccountSettings from './screens/AccountSettings';
import SignUp from './screens/SignUp';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Header />
          <main className="flex-grow-1">
            <Container fluid className="p-0">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/project/:projectId" element={<ProjectDetail />} />
                <Route path="/project/:id/donate" element={<Donate />} />
                <Route path="/favorites" element={<FavoriteProjects />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/account" element={<AccountSettings />} />
                <Route path="/signup" element={<SignUp />} />
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
