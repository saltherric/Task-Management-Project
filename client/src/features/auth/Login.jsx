import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../../components/alert';
import API from '../../api/axios';
import { Form, Input, Button, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';

function Login() {
  const navigate = useNavigate();
  // const dispatch = useDispatch();
  const [alert, setAlert] = useState(null);


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

  const handleSubmit = async ({ email, password }) => {
    try {
      const user = {
        email,
        password
      };
      const response = await API.post('/auth/login', user);
      console.log(response.data);
      
      // save token
      localStorage.setItem(
        'userInfo',
        JSON.stringify(response.data)
      );
     
       // Store alert to display on next page
       localStorage.setItem(
         'pendingAlert',
         JSON.stringify({ type: 'success', message: 'Logged in successfully.' })
       );
     
       navigate('/home');
      
    } catch (error) {
      console.log(error.response?.data);
       const backendMessage = error.response?.data?.message;
      showAlert('danger', backendMessage || 'Login failed, please try again!');
    }
  };

// return (
//     <div className="container mt-5">
//       <div className="row justify-content-center">
//         <div className="col-12 col-sm-8 col-md-5 col-lg-4">
//           <div className="auth-card p-4 border rounded shadow-sm">
//             <Alert alert={alert} onClose={() => setAlert(null)} />
//             <h1 className="auth-title text-center h3 mb-4">Login to Your Account</h1>

//             <form onSubmit={handleSubmit}>
//               <div className="mb-3">
//                 <label className="form-label">Email</label>
//                 <input 
//                   type="email" 
//                   className="form-control" 
//                   placeholder="Enter email" 
//                   value={email} 
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                 />
//               </div>

//               <div className="mb-4">
//                 <label className="form-label">Password</label>
//                 <input 
//                   type="password" 
//                   className="form-control" 
//                   placeholder="Enter password" 
//                   value={password} 
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                 />
//               </div>

//               <button type="submit" className="btn btn-primary w-100">Login</button>

//               <div className="text-center mt-3">
//                 <Link to="/register">Register</Link>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

  return (
    <div className="login-container">
      <Alert alert={alert} onClose={() => setAlert(null)} />
      <div className="login-card">
        <h1 className="login-title">Login</h1>

        <Form
          name="login_form"
          initialValues={{ remember: false }}
          onFinish={handleSubmit}
          requiredMark={false} // Hides the red asterisks
        >
          {/* Email Input */}
          <Form.Item name="email" rules={[{ required: true, message: 'Please input your Email!' }]}>
            <Input prefix={<MailOutlined className="input-icon" />} placeholder="Email" 
              className="antd-custom-input"
            />
          </Form.Item>

          {/* Password Input */}
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password 
              placeholder="Password" 
              prefix={<LockOutlined className="input-icon" />} 
              className="antd-custom-input"
            />
          </Form.Item>

          {/* Options Row (Remember Me & Forgot Password) */}
          <div className="login-options">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox className="antd-custom-checkbox">Remember me</Checkbox>
            </Form.Item>
            <a className="forgot-password" href="#forgot">
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <Form.Item>
            <Button type="primary" htmlType='submit' className="login-button" >
              Login
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <p className="register-text">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
export default Login;