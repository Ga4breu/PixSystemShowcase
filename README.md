Notas para o Recrutador:
Para inicializar o repositório é necessário adicionar variáveis de ambiente tanto no frontend quanto no backend, o intuito desse repositório é mostrar o código para fins de recrutamento.

O aplicativo consiste em um website onde os clientes da empresa podem acompanhar as métricas de vendas e alguns dados da máquina, bem como telemetria (status, nível de água etc..). O banco de dados está na hostinger em MySQL.

Note que o backend está implementado para o protocolo http e não https, clonei somente a branch de desenvolvimento, a de produção utiliza https.

Se tiver necessidade de rodar localmente posso criar uma DB e passar os .env
Para inicializar o front: npm install -> npm run dev
Para inicializar o back: npm install -> node index.js


Tela de login: ![image](https://github.com/user-attachments/assets/0d029719-9ef3-4b1a-ab21-f49290a92fa7)

Tela do mapa de máquinas do usuário: ![image](https://github.com/user-attachments/assets/7ae4ae87-1c65-4e1b-90b8-e6e4d9744c8f)

Tela de Máquinas: ![image](https://github.com/user-attachments/assets/2e3a9c73-aaf5-475a-8487-f5eb144abab6)

Modal para verificar as transações: ![Sem título](https://github.com/user-attachments/assets/f35e20d2-5264-4540-a80e-27464e5f1481)



Existem outras funcionalidades associadas a máquina e a outro backend que estabelece conexões com os micro controladores ESP que estão na máquina e se comunicam através de requisições https mas sem telas.
