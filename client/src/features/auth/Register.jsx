import React, { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import axios  from 'axios';
import Alert from '../../components/alert';

function Register() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!alert) return;

    const timerId = setTimeout(() => {
      setAlert(null);
    }, 2500); 

    return () => clearTimeout(timerId);
  }, [alert]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const user = {
        username,
        email,
        password
      }
      const response = await axios.post('http://localhost:5000/api/auth/register', user);
      console.log(response.data);
      
      // save token
      localStorage.setItem(
        'userInfo',
        JSON.stringify(response.data)
      );
     
       // Store alert to display on next page
       localStorage.setItem(
         'pendingAlert',
         JSON.stringify({ type: 'success', message: 'Registered successfully.' })
       );
     
       navigate('/login');
      
    } catch (error) {
      console.log(error.response?.data);
      const backendMessage = error.response?.data?.message;
      showAlert('danger', backendMessage);
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-8 col-md-5 col-lg-4">
          <div className="auth-card p-4 border rounded shadow-sm">
            <Alert alert={alert} onClose={() => setAlert(null)} />
            <h1 className="auth-title text-center h3 mb-4">Create Account</h1>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email" 
                  className="form-control" 
                  placeholder="Enter email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Password</label>
                <input
                  type="password" 
                  className="form-control" 
                  placeholder="Enter password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-100">Register</button>          
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;