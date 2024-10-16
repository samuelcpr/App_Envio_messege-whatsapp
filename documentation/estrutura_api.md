Dependências:
express: Framework para construir a API.
cors: Middleware para permitir solicitações de diferentes origens (Cross-Origin Resource Sharing).
body-parser: Middleware para processar o corpo das requisições (JSON ou URL-encoded).
multer: Middleware para lidar com upload de arquivos, necessário para o envio de imagens.
venom-bot: Biblioteca para automação de WhatsApp.
path: Módulo do Node.js para lidar com caminhos de arquivos.
fs: Módulo do Node.js para manipulação de arquivos.
axios: Cliente HTTP para fazer requisições a outras APIs.
Estrutura do código:
1. Configuração básica do Express e middlewares:
javascript
Copiar código
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
Aqui, o servidor Express é inicializado e o cors é configurado para permitir o acesso de diferentes origens. O body-parser é usado para processar o corpo das requisições HTTP, tanto no formato JSON quanto no formato URL-encoded.

2. Configuração do multer para upload de arquivos:
javascript
Copiar código
const storage = multer.memoryStorage();
const upload = multer({ storage });
O multer é configurado para armazenar os arquivos na memória (em vez de no sistema de arquivos) usando memoryStorage.
O upload vai gerenciar o upload de arquivos, como a imagem que será enviada pelo WhatsApp.
3. Configuração da conexão com PostgreSQL (não detalhada no exemplo):
javascript
Copiar código
const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "mydatabase",
  password: "123",
  port: 5432,
});
Isso configura a conexão com um banco de dados PostgreSQL usando o pacote pg.
A API pode armazenar as imagens no banco ou apenas usá-las no envio de mensagens.
4. Rota para enviar mensagens via WhatsApp:
javascript
Copiar código
app.post("/send", upload.single("image"), async (req, res) => {
  const numbers = JSON.parse(req.body.numbers);
  const message = req.body.message;
  const image = req.file; // Acessa o arquivo carregado

  try {
    if (!sharedClient) {
      return res.status(400).json({ success: false, message: "WhatsApp não conectado" });
    }

    // Enviar mensagens para todos os números
    const promises = numbers.map(async (number) => {
      const to = `${number}@c.us`; // Formatar o número para WhatsApp
      let response;

      if (image) {
        // Obter a extensão do arquivo de imagem (ex.: .jpg, .png)
        const imageType = path.extname(image.originalname).substring(1); // Remover o ponto da extensão
        const imageData = `data:image/${imageType};base64,${image.buffer.toString("base64")}`; // Adicionar prefixo do tipo de imagem

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
Explicação da lógica:
Recepção dos dados via POST:

req.body.numbers: contém uma lista de números de telefone (em JSON) para os quais as mensagens serão enviadas.
req.body.message: contém o texto da mensagem que será enviada.
req.file: é a imagem enviada via multer.
Verificação da conexão com WhatsApp:

Verifica se o sharedClient (sessão do WhatsApp) está conectada. Se não estiver, retorna um erro.
Formatação dos números de telefone:

Os números de telefone são formatados adicionando @c.us, que é o formato necessário para enviar mensagens via WhatsApp.
Envio de imagem:

Se uma imagem foi carregada, ela é convertida para base64 e enviada via sharedClient.sendImageFromBase64().
O tipo da imagem é detectado a partir da extensão do arquivo (ex.: .jpg ou .png), e a string base64 é formada com o prefixo correto (data:image/...;base64,...).
Envio de mensagem de texto:

Se nenhuma imagem foi enviada, a função sharedClient.sendText() é chamada para enviar apenas o texto da mensagem.
Envio para múltiplos números:

A função Promise.all() é usada para garantir que todas as mensagens sejam enviadas simultaneamente para cada número da lista.
Respostas da API:

Se o envio for bem-sucedido, a resposta contém os resultados de todas as mensagens enviadas.
Caso ocorra um erro, ele é capturado e retornado ao cliente.
5. Servidor e porta:
javascript
Copiar código
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
Aqui, o servidor é inicializado na porta definida na variável de ambiente PORT, ou na porta 3333 se a variável de ambiente não estiver definida.

Resumo:
Este script é uma API que:

Permite o envio de mensagens de texto e imagens para números de WhatsApp.
Usa a biblioteca venom-bot para interagir com o WhatsApp.
Recebe uma lista de números, uma mensagem e uma imagem (opcional) via POST e envia para cada número.
Converte imagens para base64 com o formato correto antes de enviá-las.
Garante que a sessão do WhatsApp esteja ativa para enviar as mensagens.