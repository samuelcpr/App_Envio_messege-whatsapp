const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const { create } = require("venom-bot");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());

// Middleware para interpretar dados JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração do armazenamento do multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configuração do PostgreSQL
const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "mydatabase",
  password: "123",
  port: 5432,
});

let sharedClient;

// Rota para testar a conexão e obter o QR code
app.get("/qrcode", async (req, res) => {
  try {
    if (!sharedClient) {
      sharedClient = await create(
        "sessionName",
        (base64Qr) => {
          res.status(200).json({ success: true, qrCode: base64Qr });
        },
        (statusSession) => {
          console.log("Status da sessão:", statusSession);
        },
        {
          browserArgs: ["--no-sandbox"],
        }
      );
    } else {
      const qrCode = await sharedClient.getQrCode();
      res.status(200).json({ success: true, qrCode });
    }
  } catch (error) {
    console.error("Erro ao obter QR code:", error);
    res.status(500).json({ success: false, message: "Erro ao obter QR code" });
  }
});

// Nova rota para enviar uma imagem e salvá-la no banco de dados
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { buffer, originalname } = req.file;
    const imageData = buffer.toString("base64");

    // Salvar a imagem no banco de dados
    const query = "INSERT INTO images(name, data) VALUES($1, $2) RETURNING id";
    const values = [originalname, imageData];
    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      message: "Imagem salva com sucesso",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao fazer upload da imagem" });
  }
});

// Rota para enviar mensagens via WhatsApp (com ou sem imagem)
app.post("/send", upload.single("image"), async (req, res) => {
  const numbers = JSON.parse(req.body.numbers);
  const message = req.body.message;
  const image = req.file; // Acessa o arquivo carregado

  try {
    if (!sharedClient) {
      return res
        .status(400)
        .json({ success: false, message: "WhatsApp não conectado" });
    }

    // Enviar mensagens para todos os números
    const promises = numbers.map(async (number) => {
      const to = `${number}@c.us`; // Formatar o número para WhatsApp
      let response;

      if (image) {
        // Obter a extensão do arquivo de imagem (ex.: .jpg, .png)
        const imageType = path.extname(image.originalname).substring(1); // Remover o ponto da extensão
        const imageData = `data:image/${imageType};base64,${image.buffer.toString(
          "base64"
        )}`; // Adicionar prefixo do tipo de imagem

        // Envio de imagem com mensagem
        response = await sharedClient.sendImageFromBase64(
          to,
          imageData, // Imagem em base64 com o prefixo correto
          image.originalname, // Nome do arquivo
          message
        );
      } else {
        // Envio apenas de mensagem
        response = await sharedClient.sendText(to, message);
      }

      return response;
    });

    const results = await Promise.all(promises); // Aguarda todas as promessas serem resolvidas
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Erro ao enviar mensagens:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao enviar mensagens",
      error: error.message,
    });
  }
});

// Rota para desconectar a sessão do WhatsApp
app.get("/disconnect", async (req, res) => {
  try {
    if (sharedClient) {
      await sharedClient.close();
      sharedClient = null;
      res.status(200).json({
        success: true,
        message: "Todos os dispositivos foram desconectados com sucesso.",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Não há dispositivos conectados para desconectar.",
      });
    }
  } catch (error) {
    console.error("Erro ao desconectar dispositivos:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao desconectar dispositivos." });
  }
});

// Inicializa o servidor
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
