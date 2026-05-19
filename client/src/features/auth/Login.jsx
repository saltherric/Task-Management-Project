import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Alert from '../../components/alert';

function Login() {
  const navigate = useNavigate();
  // const dispatch = useDispatch();
  const [alert, setAlert] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  // Check for pending alert from previous page
  useEffect(() => {
    const pendingAlert = localStorage.getItem('pendingAlert');
    if (pendingAlert) {
      setAlert(JSON.parse(pendingAlert));
      localStorage.removeItem('pendingAlert');
    }
  }, []);

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
        email,
        password
      };
      const response = await axios.post('http://localhost:5000/api/auth/login', user);
      console.log(response.data);
      
      // save token
      localStorage.setItem(
        'userInfo',
        JSON.stringify(response.data)
      );
     
       // Store alert to display on next page
       localStorage.setItem(
         'pendingAlert',
         JSON.stringify({ type: 'success', message: 'Logined successfully.' })
       );
     
       navigate('/');
      
    } catch (error) {
      console.log(error.response?.data);
       const backendMessage = error.response?.data?.message;
      showAlert('danger', backendMessage || 'Login failed, please try again!');
    }
  };

return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        {/* col-md-4 sets it to 1/3rd of the screen width on medium screens and up */}
        <div className="col-12 col-sm-8 col-md-5 col-lg-4">
          <div className="auth-card p-4 border rounded shadow-sm">
            <Alert alert={alert} onClose={() => setAlert(null)} />
            <h1 className="auth-title text-center h3 mb-4">Login to Your Account</h1>

            <form onSubmit={handleSubmit}>
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

              <button type="submit" className="btn btn-primary w-100">Login</button>

              <div className="text-center mt-3">
                <Link to="/register">Register</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;