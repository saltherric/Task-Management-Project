import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './themes/theme.css'
import '@fortawesome/fontawesome-free/css/all.min.css';
// import 'antd/dist/reset.css'
import ThemeProvider from './contexts/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
)