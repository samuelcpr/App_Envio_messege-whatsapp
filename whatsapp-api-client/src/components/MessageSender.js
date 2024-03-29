import React, { useState } from 'react';
import axios from 'axios';

const MessageSender = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const sendMessage = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post('/send', { numbers: [phoneNumber], message });
      setResponseMessage(response.data.message);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setResponseMessage('Erro ao enviar mensagem');
    }
  };

  return (
    <div>
      <h2>Enviar Mensagem</h2>
      <form onSubmit={sendMessage}>
        <label htmlFor="phoneNumber">Número de telefone:</label>
        <input type="text" id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
        <br /><br />
        <label htmlFor="message">Mensagem:</label>
        <input type="text" id="message" value={message} onChange={(e) => setMessage(e.target.value)} required />
        <br /><br />
        <button type="submit">Enviar</button>
      </form>
      {responseMessage && <div>{responseMessage}</div>}
    </div>
  );
};

export default MessageSender;
