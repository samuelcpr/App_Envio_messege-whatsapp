# Use uma imagem base do Node.js
FROM node:18

# Configuração do diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copie o arquivo de dependências para o container
COPY package*.json ./

# Instale as dependências do projeto
RUN npm install

# Copie o restante do código para o container
COPY . .

# Exponha a porta usada pela aplicação
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "run", "dev"]
