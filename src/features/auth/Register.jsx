import React from 'react'
import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="auth-container m-5">
      <div className="auth-card">
        <h1 className="auth-title text-center">Create Account </h1>

        <form>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input type="text" className="form-control" placeholder="Enter username" />
          </div>

          <div className="mb-3">
            <label className="form-label"> Email</label>
            <input
              type="email" className="form-control" placeholder="Enter email"
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Password </label>
            <input
              type="password" className="form-control" placeholder="Enter password"
            />
          </div>

          <button className="btn btn-primary w-100">Register </button>

          <div className="text-center mt-3">
            <Link to="/"> Login</Link>
          </div>
          
        </form>
      </div>
    </div>
  );
}

export default Register;