import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './component/Navbar';
import ProtectedRoute from './component/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GameEdit from './pages/GameEdit';
import QuestionEdit from './pages/QuestionEdit';
import SessionAdmin from './pages/SessionAdmin';
import JoinGame from './pages/JoinGame';
import PlayerGame from './pages/PlayerGame';
import PlayerResults from './pages/PlayerResults';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LanguageProvider>
        <Router>
          <AuthProvider>
            <Navbar />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Player routes */}
              <Route path="/play" element={<JoinGame />} />
              <Route path="/play/:playerId" element={<PlayerGame />} />
              <Route path="/results/:playerId" element={<PlayerResults />} />

              {/* Protected admin routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game/:gameId"
                element={
                  <ProtectedRoute>
                    <GameEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game/:gameId/question/:questionId"
                element={
                  <ProtectedRoute>
                    <QuestionEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/session/:sessionId"
                element={
                  <ProtectedRoute>
                    <SessionAdmin />
                  </ProtectedRoute>
                }
              />

              {/* Default routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
