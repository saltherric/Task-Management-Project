import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Form, Input, Button, Checkbox } from 'antd';
import { LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { useAlert } from '../contexts/AlertContext';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || '/home';
  // const dispatch = useDispatch();
  const { showAlert } = useAlert();

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
     
      showAlert('Logged in successfully.', 'success');
      navigate(redirectTo, { replace: true });
      
    } catch (error) {
      console.log(error.response?.data);
      const backendMessage = error.response?.data?.message;
      showAlert(backendMessage || 'Login failed, please try again!', 'danger');
    }
  };

  const handleGoogleLogin = () => {
    const apiBaseUrl = API.defaults.baseURL || 'http://localhost:5000/api';
    window.location.href = `${apiBaseUrl}/auth/google`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <div className="bg-(--color-card) backdrop-blur-[10px] border border-indigo-600/10 rounded-3xl py-10 px-[35px] w-full max-w-105 text-center shadow-[0_8px_32px_rgba(30,41,59,0.10)]">
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

        <div className="flex items-center gap-3 my-5">
          <div className="h-[1px] flex-1 bg-indigo-600/10"></div>
          <span className="text-xs text-(--color-muted) uppercase">or</span>
          <div className="h-[1px] flex-1 bg-indigo-600/10"></div>
        </div>

        <Button 
          type="default" 
          icon={<GoogleOutlined />} 
          className="google-login-button"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </Button>

        {/* Footer */}
        <p className="mt-6 text-sm text-(--color-muted)">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
export default Login;
