'use client';

import { useState } from 'react';

export default function LoginForm() {
  const [isActive, setIsActive] = useState(false);

  const handleRegisterClick = () => {
    setIsActive(true);
  };

  const handleLoginClick = () => {
    setIsActive(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted');
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gradient-to-r from-gray-200 to-blue-100">
      <div className={`form-container ${isActive ? 'active' : ''}`}>
        {/* Login Form */}
        <div className="form-box login">
          <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
            <h1 style={{ fontSize: '36px', margin: '-10px 0 15px 0' }}>Login</h1>

            <div className="input-box">
              <input type="text" placeholder="Username" required />
              <i className="bx bxs-user"></i>
            </div>

            <div className="input-box">
              <input type="password" placeholder="Password" required />
              <i className="bx bxs-lock-alt"></i>
            </div>

            <div className="forgot-link">
              <a href="#" style={{ fontSize: '14.5px', color: '#333' }}>
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="btn-primary">Login</button>

          </form>
        </div>

        <div className="form-box register">
          <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
            <h1 style={{ fontSize: '36px', margin: '-10px 0 15px 0' }}>Registration</h1>

            <div className="input-box">
              <input type="text" placeholder="Username" required />
              <i className="bx bxs-user"></i>
            </div>

            <div className="input-box">
              <input type="email" placeholder="Email" required />
              <i className="bx bxs-envelope"></i>
            </div>

            <div className="input-box">
              <input type="password" placeholder="Password" required />
              <i className="bx bxs-lock-alt"></i>
            </div>

            <button type="submit" className="btn-primary">Register</button>


          </form>
        </div>

        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1 style={{ fontSize: '36px', marginBottom: '15px' }}>Hello, Welcome!</h1>
            <p style={{ marginBottom: '20px' }}>Don&apos;t have an account?</p>
            <button className="btn-primary btn-outline" onClick={handleRegisterClick}>
              Register
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1 style={{ fontSize: '36px', marginBottom: '15px' }}>Welcome Back!</h1>
            <p style={{ marginBottom: '20px' }}>Already have an account?</p>
            <button className="btn-primary btn-outline" onClick={handleLoginClick}>
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}