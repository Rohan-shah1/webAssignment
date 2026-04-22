import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastProvider = ({ theme }) => {
  return (
    <ToastContainer 
      position="top-right" 
      autoClose={3000} 
      theme={theme}
      hideProgressBar={false} 
      newestOnTop={false} 
      closeOnClick 
      rtl={false} 
      pauseOnFocusLoss 
      draggable 
      pauseOnHover 
    />
  );
};

export default ToastProvider;
