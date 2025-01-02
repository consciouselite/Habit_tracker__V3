import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
    import { AuthProvider } from './contexts/AuthContext';
    import { Signup } from './pages/auth/Signup';
    import { Login } from './pages/auth/Login';
    import { OnboardingSurvey } from './pages/onboarding/OnboardingSurvey';
    import { Dashboard } from './pages/Dashboard';
    import { Habits } from './pages/Habits';
    import { Stats } from './pages/Stats';
    import { FlexBook } from './pages/FlexBook';
    import { PrivateRoute } from './components/PrivateRoute';
    import { LandingPage } from './pages/LandingPage';
    import { Goals } from './pages/Goals';

    function App() {
      return (
        <Router>
          <AuthProvider>
            <Routes>
              {/* Default route to Landing Page */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Auth routes */}
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />

              {/* Protected routes */}
              <Route path="/onboarding/*" element={
                <PrivateRoute>
                  <OnboardingSurvey />
                </PrivateRoute>
              } />
              
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              
              <Route path="/habits" element={
                <PrivateRoute>
                  <Habits />
                </PrivateRoute>
              } />
              
              <Route path="/stats" element={
                <PrivateRoute>
                  <Stats />
                </PrivateRoute>
              } />
              
              <Route path="/flexbook" element={
                <PrivateRoute>
                  <FlexBook />
                </PrivateRoute>
              } />
              <Route path="/goals" element={
                <PrivateRoute>
                  <Goals />
                </PrivateRoute>
              } />
            </Routes>
          </AuthProvider>
        </Router>
      );
    }

    export default App;
