import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import "./App.css";

function App() {
  const [qrCode, setQrCode] = useState("");
  const [numbers, setNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Testar a conexão ao carregar a página
  useEffect(() => {
    const testConnection = async () => {
      try {
        await axios.get("http://localhost:3333/qrcode");
        setConnected(true);
      } catch (error) {
        setConnected(false);
      }
    };

    testConnection();
  }, []);

  const handleGetQRCode = async () => {
    try {
      const response = await axios.get("http://localhost:3333/qrcode");
      setQrCode(response.data.qrCode);
      setConnected(true);
    } catch (error) {
      console.error("Erro ao obter QR code:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await axios.get("http://localhost:3333/disconnect");
      setConnected(false);
      setQrCode(""); // Limpar QR code ao desconectar
      setResponseMessage("Desconectado com sucesso.");
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      setResponseMessage("Erro ao desconectar.");
    }
  };

  const handleSendMessage = async () => {
    try {
      if (!numbers) {
        throw new Error("Por favor, insira pelo menos um número de telefone.");
      }

      const formattedNumbers = numbers.split(",").map((num) => num.trim());

      for (const num of formattedNumbers) {
        if (!/^\d{10,15}$/.test(num)) {
          throw new Error("Por favor, insira números válidos (10-15 dígitos).");
        }
      }

      const formData = new FormData();
      formData.append("numbers", JSON.stringify(formattedNumbers));
      formData.append("message", message);

      if (image) {
        formData.append("image", image); // Adiciona a imagem ao FormData
      }

      setLoading(true);
      const response = await axios.post(
        "http://localhost:3333/send",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResponseMessage(
        response.data.message || "Mensagens enviadas com sucesso."
      );
      setNumbers("");
      setMessage("");
      setImage(null);
    } catch (error) {
      console.error("Erro ao enviar mensagens:", error);
      setResponseMessage(
        error.response && error.response.data
          ? error.response.data.message
          : "Erro ao enviar mensagens."
      );
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (acceptedFiles) => {
    setImage(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="App">
      <h1>WhatsApp API</h1>
      {!connected ? (
        <p>Não foi possível conectar-se à API.</p>
      ) : (
        <>
          <div>
            <button onClick={handleGetQRCode}>Obter QR Code</button>
            <button onClick={handleDisconnect}>Desconectar</button>
            {qrCode && (
              <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" />
            )}
          </div>
          <div>
            <label htmlFor="numbers">Números (separados por vírgula):</label>
            <input
              type="text"
              id="numbers"
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              placeholder="Ex: 5511998765432, 5511987654321"
            />
          </div>
          <div>
            <label htmlFor="message">Mensagem:</label>
            <input
              type="text"
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem"
            />
          </div>
          <div
            {...getRootProps()}
            style={{
              border: "2px dashed gray",
              padding: "20px",
              margin: "20px 0",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <input {...getInputProps()} />
            <p>
              Arraste e solte uma imagem aqui, ou clique para selecionar uma
              imagem
            </p>
            {image && <p>Arquivo selecionado: {image.name}</p>}
          </div>
          <button onClick={handleSendMessage} disabled={loading}>
            {loading ? "Enviando..." : "Enviar Mensagens"}
          </button>
          {responseMessage && <p>{responseMessage}</p>}
        </>
      )}
    </div>
  );
}

export default App;
