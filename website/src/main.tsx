import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import AboutUs from './AboutUs';
import ContactUs from './ContactUs';
import FAQ from './FAQ';
import NotFound from './NotFound';
import ServerError from './ServerError';
import './styles.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}