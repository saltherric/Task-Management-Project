import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login } from './authSlice';

function Login() {
  const users = useSelector(
    state => state.auth.users
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const foundUser = users.find(
      user => user.email === email && user.password === password
    );
    if (foundUser) {
      dispatch(login(foundUser));
      navigate("/home");
    } else{
      alert("Invalid Credential");
    }
  };

  return (
    <div className='auth-container m-5'>
      <div className="auth-card">
        <h1 className='auth-title text-center'>Login to Your Account</h1>

        <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label className='form-label'>Email</label>
                <input type="email" className='form-control' placeholder='Enter email' value={email} onChange={(e) => setEmail(e.target.value)}/>
            </div>

            <div className="mb-4">
                <label className='form-label'>Password</label>
                <input type="password" className='form-control' placeholder='Enter password' value={password} onChange={(e) => setPassword(e.target.value)}/>
            </div>

            <button type='submit' className='btn btn-sm btn-primary w-100'>Login</button>
            
            <div className="text-center mt-3">
              <Link to="/register">Register</Link>
            </div>
        </form>
      </div>
    </div>
  )
}
export default Login