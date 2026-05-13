import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from "react-router-dom";
import { register } from './authSlice';

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = {
      id: Date.now(),
      username,
      email,
      password,
    }
    dispatch(register(user));

    navigate("/login");
  }

  return (
    <div className="auth-container m-5">
      <div className="auth-card">
        <h1 className="auth-title text-center">Create Account </h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input type="text" className="form-control" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)}/>
          </div>

          <div className="mb-3">
            <label className="form-label"> Email</label>
            <input
              type="email" className="form-control" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Password </label>
            <input
              type="password" className="form-control" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type='submit' className="btn btn-primary w-100">Register </button>

          <div className="text-center mt-3">
            <Link to="/"> Login</Link>
          </div>
          
        </form>
      </div>
    </div>
  );
}

export default Register;