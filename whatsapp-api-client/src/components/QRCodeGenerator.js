import React, { useState } from 'react';
import axios from 'axios';

const QRCodeGenerator = () => {
  const [qrCode, setQRCode] = useState('');

  const generateQRCode = async () => {
    try {
      const response = await axios.get('/qrcode');
      setQRCode(response.data.qrCode);
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      alert('Erro ao gerar QR code');
    }
  };

  return (
    <div>
      <h2>Gerar QR Code</h2>
      <button onClick={generateQRCode}>Gerar</button>
      {qrCode && <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" />}
    </div>
  );
};

export default QRCodeGenerator;
