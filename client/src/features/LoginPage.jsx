import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/alert';
import API from '../api/axios';
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Alert alert={alert} onClose={() => setAlert(null)} />
      <div className="bg-(--color-card) backdrop-blur-[10px] border border-blue-600/10 rounded-3xl py-10 px-[35px] w-full max-w-105 text-center shadow-[0_8px_32px_rgba(30,41,59,0.10)]">
        <h1 className="mb-9 pb-8 text-4xl font-semibold">Login</h1>

        <Form
          name="login_form"
          initialValues={{ remember: false }}
          onFinish={handleSubmit}
          requiredMark={false} // Hides the red asterisks
        >
          {/* Email Input */}
          <Form.Item name="email" rules={[{ required: true, message: 'Please input your Email!' }]}>
            <Input prefix={<MailOutlined className="input-icon" />} placeholder="Email" 
              className="antd-custom-input "
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
          <div className="mb-6 flex items-center justify-between  ">
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
        <p className="mt-6 text-sm text-(--color-muted)">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
export default Login;