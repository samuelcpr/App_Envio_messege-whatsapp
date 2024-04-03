const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { create, Client } = require('venom-bot'); // Corrigido: Importando Client de venom-bot

const app = express();
app.use(cors());
// Configuração do middleware para análise do corpo das requisições
app.use(bodyParser.json());

let sharedClient; // Cliente compartilhado para a sessão WhatsApp

// Rota para testar a conexão e obter o QR code
app.get('/qrcode', async (req, res) => {
  try {
    if (!sharedClient) {
      // Se não houver um cliente compartilhado, crie um
      sharedClient = await create("sessionName", (base64Qr, asciiQR) => {
        res.status(200).json({ success: true, qrCode: base64Qr }); // Retorna o QR code
      }, (statusSession) => {
        console.log("Status da sessão:", statusSession);
      }, {
        browserArgs: ["--no-sandbox"], // Adicione essa opção se estiver executando em um ambiente headless (sem interface gráfica)
      });
    } else {
      // Se já houver um cliente compartilhado, retorne o QR code existente
      const qrCode = await sharedClient.getQrCode();
      res.status(200).json({ success: true, qrCode });
    }
  } catch (error) {
    console.error('Erro ao obter QR code:', error);
    res.status(500).json({ success: false, message: 'Erro ao obter QR code' });
  }
});

app.get('/disconnect', async (req, res) => {
  try {
    if (sharedClient) {
      // Verifica se há um cliente compartilhado
      await sharedClient.close(); // Fecha a sessão compartilhada
      sharedClient = null; // Define sharedClient como null para indicar que não há sessão ativa
      res.status(200).json({ success: true, message: 'Todos os dispositivos foram desconectados com sucesso.' });
    } else {
      // Se não houver um cliente compartilhado ativo, retorna uma mensagem
      res.status(200).json({ success: true, message: 'Não há dispositivos conectados para desconectar.' });
    }
  } catch (error) {
    console.error('Erro ao desconectar dispositivos:', error);
    res.status(500).json({ success: false, message: 'Erro ao desconectar dispositivos.' });
  }
});

app.get('/login', async (req, res) => {
  try {
    const client = new Client(); // Corrigido: Criando uma nova instância de Client
    await client.initialize(); // Inicialize o cliente

    // Gere o QR code para o login do usuário
    const qrCode = await client.getQrCode();

    res.status(200).json({ success: true, qrCode });
  } catch (error) {
    console.error('Erro ao gerar QR code para login:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar QR code para login.' });
  }
});

// Rota para receber as mensagens a serem enviadas
app.post('/send', async (req, res) => {
  const { numbers, message } = req.body;

  try {
    // Verifique se há um cliente compartilhado
    if (!sharedClient) {
      throw new Error('Sessão WhatsApp não inicializada. Obtenha o QR code primeiro.');
    }

    // Função para enviar mensagens em massa
    async function sendMessages(numbers, message) {
      for (const number of numbers) {
        try {
          // Corrigindo o formato do número de telefone
          const formattedNumber = number + "@c.us";
          await sharedClient.sendText(formattedNumber, message);
          console.log(`Mensagem enviada para ${number}`);
        } catch (error) {
          console.error(`Erro ao enviar mensagem para ${number}:`, error);
          // Se houver um erro, continue enviando para os próximos números
          continue;
        }
      }
    }

    // Envie mensagens em massa
    await sendMessages(numbers, message);

    res.status(200).json({ success: true, message: 'Mensagens enviadas com sucesso' });
  } catch (error) {
    console.error("Erro ao enviar mensagens:", error);
    res.status(500).json({ success: false, message: 'Erro ao enviar mensagens' });
  }
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
