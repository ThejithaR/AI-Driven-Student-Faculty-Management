import React, { useState } from 'react';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const Login = () => {
  const [state, setState] = useState('Sign Up');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const validatePassword = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (password.length >= 12 && strength > 4) strength++;
    return strength;
  };

  const isPasswordValid = (password) => {
    return (
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[^a-zA-Z0-9]/.test(password)
    );
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (state === 'Sign Up') {
      setPasswordStrength(validatePassword(newPassword));
    }
  };

  const getStrengthLabel = () => {
    const labels = ['Too Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
    return labels[passwordStrength - 2];
  };

  const getStrengthColor = () => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500'];
    return colors[passwordStrength - 2];
  };

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      setErrorMessage('');

      if (state === 'Sign Up') {
        if (!isPasswordValid(password)) {
          setErrorMessage('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a special character.');
          toast.error(errorMessage);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
          toast.error(errorMessage);
          return;
        }

        if (username.length < 8) {
          setErrorMessage('Username needs to be at least 8 characters long');
          toast.error(errorMessage);
          return;
        }

        axios.defaults.withCredentials = true;
        const { data } = await axios.post(backendUrl + '/api-gateway/user-profile/sign-up/', {
          username,
          email,
          password,
        });

        if (data.success) {
          localStorage.setItem('token', data.token);
          console.log(data);
        } else {
          toast.error(data.message);
        }
      } else {
        axios.defaults.withCredentials = true;
        const { data } = await axios.post(backendUrl + '/api-gateway/user-profile/sign-in/', {
          email,
          password,
        });

        if (data.success) {
          localStorage.setItem('uid', data.id);
          localStorage.setItem('email', data.email);
          localStorage.setItem('role', data.role);
          console.log(data);
        } else {
          toast.error(data.message);
        }
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <img
        onClick={() => navigate('/')}
        src={assets.home}
        alt="Logo"
        className="absolute left-5 top-5 w-10 cursor-pointer hover:opacity-80 transition-opacity"
      />
      
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-xl">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-bold text-gray-100">
            {state === 'Sign Up' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-400">
            {state === 'Sign Up' ? 'Create your account to get started!' : 'Login to your account'}
          </p>
        </div>

        <form onSubmit={onSubmitHandler} className="space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <div className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 transition">
                <img src={assets.mail_icon} alt="" className="w-5 h-5 opacity-60" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-100 placeholder-gray-400"
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {state === 'Sign Up' && (
              <div className="relative">
                <div className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 transition">
                  <img src={assets.person_icon} alt="" className="w-5 h-5 opacity-60" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-transparent outline-none text-gray-100 placeholder-gray-400"
                    type="text"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <div className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 transition">
                <img src={assets.lock_icon} alt="" className="w-5 h-5 opacity-60" />
                <input
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full bg-transparent outline-none text-gray-100 placeholder-gray-400"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  required
                />
                <img
                  src={showPassword ? assets.show : assets.hide}
                  alt=""
                  className="w-5 h-5 cursor-pointer opacity-60 hover:opacity-100 transition"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
              {state === 'Sign Up' && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStrengthColor()} transition-all duration-300`}
                      style={{ width: `${(passwordStrength / 6) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs mt-1 text-gray-400">{getStrengthLabel()}</p>
                </div>
              )}
            </div>

            {state === 'Sign Up' && (
              <div className="relative">
                <div className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 transition">
                  <img src={assets.lock_icon} alt="" className="w-5 h-5 opacity-60" />
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-gray-100 placeholder-gray-400"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    required
                  />
                  <img
                    src={showConfirmPassword ? assets.show : assets.hide}
                    alt=""
                    className="w-5 h-5 cursor-pointer opacity-60 hover:opacity-100 transition"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs mt-1 text-red-400">Passwords do not match</p>
                )}
              </div>
            )}
          </div>

          {state === 'Login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/reset-password")}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition duration-200 transform hover:scale-[1.02]"
          >
            {state}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-400">
            {state === 'Sign Up' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setState(state === 'Sign Up' ? 'Login' : 'Sign Up')}
              className="text-indigo-400 hover:text-indigo-300 transition"
            >
              {state === 'Sign Up' ? 'Login here' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;