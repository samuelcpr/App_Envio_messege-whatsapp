_1. Instalar a biblioteca libvips_
Em sistemas baseados em Ubuntu ou Debian, você pode instalar a biblioteca libvips com o seguinte comando:

bash
Copiar código
``sudo apt-get install libvips-dev``
Isso instalará as dependências necessárias para o sharp funcionar corretamente.

_2. Reinstalar o módulo sharp_
Após instalar a biblioteca libvips, é recomendável remover a pasta node_modules e reinstalar todas as dependências para garantir que o sharp seja compilado com as dependências corretas:

Se estiver usando yarn:

bash
Copiar código
``rm -rf node_modules``
``yarn install``
Ou, se estiver usando npm:

bash
Copiar código
``rm -rf node_modules``
``npm install``
_3. Instalar o sharp com suporte específico para o sistema operacional_
Se você continuar enfrentando problemas, pode reinstalar o sharp com suporte específico para seu sistema operacional. No caso de sistemas Linux com arquitetura x64, use o comando abaixo:

bash
Copiar código
``npm install --os=linux --cpu=x64 sharp``
_4. Documentação de Instalação do sharp_
Se o problema persistir, consulte a documentação oficial de instalação do sharp para mais detalhes: Documentação de Instalação do sharp.

_5. Downgrade do Node.js (Opcional)_
Se após seguir os passos acima o erro persistir, pode haver uma incompatibilidade com a versão do Node.js que está sendo utilizada (v20.18.0). Neste caso, sugerimos fazer o downgrade para uma versão mais estável (como a v18.x), que possui melhor compatibilidade com diversas bibliotecas. Para isso, siga os comandos abaixo:

Instalar e utilizar a versão 18 do Node.js com nvm:

bash
``Copiar código``
``nvm install 18``
``nvm use 18``
Após isso, reinstale as dependências do projeto novamente:

bash
Copiar código
``rm -rf node_modules``
``yarn install``
