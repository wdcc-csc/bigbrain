import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {

    if (token && !currentUser) {
      setCurrentUser({ email: localStorage.getItem('email') });
    }
    setLoading(false);
  }, [token, currentUser]);


  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('email', email);
      setToken(token);
      setCurrentUser({ email });
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Login failed, please check your credentials' 
      };
    }
  };


  const register = async (email, password, name) => {
    try {
      const response = await authAPI.register(email, password, name);
      const { token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('email', email);
      setToken(token);
      setCurrentUser({ email, name });
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Registration failed, please try again later' 
      };
    }
  };


  const logout = async () => {
    try {
      await authAPI.logout();
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  const isAuthenticated = () => {
    return !!token;
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext; 
