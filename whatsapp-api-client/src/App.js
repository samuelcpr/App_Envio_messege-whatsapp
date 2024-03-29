import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';


function App() {
  const [qrCode, setQrCode] = useState('');
  const [numbers, setNumbers] = useState('');
  const [message, setMessage] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Função para testar a conexão ao carregar a página
    const testConnection = async () => {
      try {
        await axios.get('http://localhost:3333/qrcode');
        setConnected(true);
      } catch (error) {
        setConnected(false);
      }
    };

    testConnection(); // Testar a conexão ao carregar a página
  }, []);

  const handleGetQRCode = async () => {
    try {
      const response = await axios.get('http://localhost:3333/qrcode');
      setQrCode(response.data.qrCode);
      setConnected(true);
    } catch (error) {
      console.error('Erro ao obter QR code:', error);
    }
  };

  const handleSendMessage = async () => {
    try {
      if (!numbers) {
        throw new Error('Por favor, insira pelo menos um número de telefone.');
      }

      const response = await axios.post('http://localhost:3333/send', { numbers: numbers.split(','), message });
      setResponseMessage(response.data.message);
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error);
      setResponseMessage('Erro ao enviar mensagens');
    }
  };

  return (
    <div className="App">
      <h1>WhatsApp API</h1>
      {!connected ? (
        <p>Não foi possível conectar-se à API.</p>
      ) : (
        <>
          <div>
            <button onClick={handleGetQRCode}>Obter QR Code</button>
            {qrCode && <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" />}
          </div>
          <div>
            <label htmlFor="numbers">Números (separados por vírgula):</label>
            <input type="text" id="numbers" value={numbers} onChange={(e) => setNumbers(e.target.value)} />
          </div>
          <div>
            <label htmlFor="message">Mensagem:</label>
            <input type="text" id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <button onClick={handleSendMessage}>Enviar Mensagens</button>
          {responseMessage && <p>{responseMessage}</p>}
        </>
      )}
    </div>
  );
}

export default App;
