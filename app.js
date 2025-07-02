require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { create } = require('venom-bot');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração do multer para upload em memória
const upload = multer({ storage: multer.memoryStorage() });

// Configuração do banco PostgreSQL via Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Variáveis globais para Venom session e QR Code
let sharedClient = null;
let qrCodeCache = null;
let initializing = false;

// Rota para obter QR Code
app.get('/qrcode', async (req, res) => {
  try {
    if (sharedClient) {
      return res.status(200).json({ success: true, message: 'WhatsApp já conectado.' });
    }

    if (qrCodeCache && !initializing) {
      return res.status(200).json({ success: true, qrCode: qrCodeCache });
    }

    if (!initializing) {
      initializing = true;
      create(
        process.env.VENOM_SESSION_NAME || 'sessionName',
        (base64Qr) => {
          console.log('QR Code gerado');
          qrCodeCache = base64Qr;
        },
        (statusSession) => {
          console.log('Status da sessão:', statusSession);
          if (statusSession === 'isLogged') {
            qrCodeCache = null; // limpar QR quando logado
          }
          if (statusSession === 'desconnectedMobile') {
            sharedClient = null; // reset client se desconectado pelo celular
          }
        },
        {
          headless: process.env.HEADLESS === 'true' ? true : false,
          browserArgs: ['--no-sandbox'],
        }
      )
        .then((client) => {
          sharedClient = client;
          initializing = false;
        })
        .catch((error) => {
          console.error('Erro ao criar cliente Venom:', error);
          initializing = false;
          return res.status(500).json({ success: false, message: 'Erro ao iniciar WhatsApp.' });
        });
    }

    // Esperar QR Code ser gerado
    const waitForQR = async () => {
      const start = Date.now();
      while (!qrCodeCache) {
        if (Date.now() - start > 15000) {
          return res.status(500).json({ success: false, message: 'Timeout ao gerar QR Code.' });
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      return res.status(200).json({ success: true, qrCode: qrCodeCache });
    };

    await waitForQR();
  } catch (error) {
    console.error('Erro na rota /qrcode:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao gerar QR Code.' });
  }
});

// Rota para upload de imagem e salvar no banco
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada.' });

    const { originalname, buffer } = req.file;
    const imageData = buffer.toString('base64');

    const query = 'INSERT INTO images(name, data) VALUES($1, $2) RETURNING id';
    const values = [originalname, imageData];
    const result = await pool.query(query, values);

    res.status(200).json({ success: true, message: 'Imagem salva com sucesso', id: result.rows[0].id });
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    res.status(500).json({ success: false, message: 'Erro ao fazer upload da imagem' });
  }
});

// Rota para enviar mensagens (texto ou imagem)
app.post('/send', upload.single('image'), async (req, res) => {
  try {
    if (!sharedClient) return res.status(400).json({ success: false, message: 'WhatsApp não conectado' });

    const numbers = JSON.parse(req.body.numbers);
    const message = req.body.message;
    const image = req.file;

    const promises = numbers.map(async (number) => {
      const to = `${number}@c.us`;
      if (image) {
        const ext = path.extname(image.originalname).substring(1);
        const base64Image = `data:image/${ext};base64,${image.buffer.toString('base64')}`;
        return await sharedClient.sendImageFromBase64(to, base64Image, image.originalname, message);
      } else {
        return await sharedClient.sendText(to, message);
      }
    });

    const results = await Promise.all(promises);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Erro ao enviar mensagens:', error);
    res.status(500).json({ success: false, message: 'Erro ao enviar mensagens', error: error.message });
  }
});

// Rota para desconectar sessão WhatsApp
app.get('/disconnect', async (req, res) => {
  try {
    if (sharedClient) {
      await sharedClient.close();
      sharedClient = null;
      qrCodeCache = null;
      res.status(200).json({ success: true, message: 'Dispositivo desconectado com sucesso.' });
    } else {
      res.status(200).json({ success: true, message: 'Nenhum dispositivo conectado.' });
    }
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    res.status(500).json({ success: false, message: 'Erro ao desconectar dispositivo.' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
