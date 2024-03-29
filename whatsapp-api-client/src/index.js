import { createRoot } from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals'; // Importe a função reportWebVitals

const root = createRoot(document.getElementById('root'));
root.render(<App />);
reportWebVitals(); // Chame a função reportWebVitals
