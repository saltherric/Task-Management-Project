import React from 'react'
import { Link } from 'react-router-dom';

function Login() {
  return (
    <div className='auth-container m-5'>
      <div className="auth-card">
        <h1 className='auth-title text-center'>Login to Your Account</h1>

        <form>
            <div className="mb-4">
                <label className='form-label'>Email</label>
                <input type="email" className='form-control' placeholder='Enter email' id='email'/>
            </div>

            <div className="mb-4">
                <label className='form-label'>Password</label>
                <input type="password" className='form-control' placeholder='Enter password' id='password'/>
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