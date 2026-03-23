import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastProvider = () => {
  // Use a custom wrapper to pass the theme dynamically if needed
  return (
    <ToastContainer 
      position="top-right" 
      autoClose={3000} 
      hideProgressBar={false} 
      newestOnTop={false} 
      closeOnClick 
      rtl={false} 
      pauseOnFocusLoss 
      draggable 
      pauseOnHover 
      theme="colored" 
    />
  );
};

export default ToastProvider;
