import React, { useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";

const MessageSender = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  // Handler para envio de mensagens
  const sendMessage = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post("/send", {
        numbers: [phoneNumber],
        message,
      });
      setResponseMessage(response.data.message);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setResponseMessage("Erro ao enviar mensagem");
    }
  };

  // Handler para obter o QR Code
  const getQRCode = async () => {
    try {
      const response = await axios.get("/qrcode");
      setQrCode(response.data.qrCode); // Salva o QR code na variável de estado
    } catch (error) {
      console.error("Erro ao obter o QR Code:", error);
      setResponseMessage("Erro ao obter QR Code");
    }
  };

  // Handler para envio de imagens
  const sendImage = async () => {
    if (!image) {
      setResponseMessage("Selecione uma imagem primeiro.");
      return;
    }

    const formData = new FormData();
    formData.append("numbers", phoneNumber);
    formData.append("file", image);

    try {
      const response = await axios.post("/send-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResponseMessage(response.data.message);
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      setResponseMessage("Erro ao enviar imagem");
    }
  };

  // Configuração do dropzone para imagens
  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    onDrop: (acceptedFiles) => setImage(acceptedFiles[0]), // Captura a primeira imagem selecionada
  });

  return (
    <div>
      <h2>Enviar Mensagem pelo WhatsApp</h2>
      <form onSubmit={sendMessage}>
        <label htmlFor="phoneNumber">Número de telefone:</label>
        <input
          type="text"
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
        <br />
        <br />
        <label htmlFor="message">Mensagem:</label>
        <input
          type="text"
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <br />
        <br />
        <button type="submit">Enviar Mensagem</button>
      </form>

      <br />
      <h3>Obter QR Code</h3>
      <button onClick={getQRCode}>Obter QR Code</button>
      {qrCode && (
        <img
          src={`data:image/png;base64,${qrCode}`}
          alt="QR Code para login no WhatsApp"
        />
      )}

      <br />
      <br />
      <h3>Anexar e Enviar Imagem</h3>
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed gray",
          padding: "20px",
          cursor: "pointer",
        }}
      >
        <input {...getInputProps()} />
        <p>Arraste uma imagem ou clique para selecionar</p>
      </div>
      {image && <p>Imagem selecionada: {image.name}</p>}
      <br />
      <button onClick={sendImage}>Enviar Imagem</button>

      {responseMessage && <div>{responseMessage}</div>}
    </div>
  );
};

export default MessageSender;
