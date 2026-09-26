import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './App.css';

// Remove React.StrictMode for faster initial render in production
createRoot(document.getElementById('root')!).render(<App />);
