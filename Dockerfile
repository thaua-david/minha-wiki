# Usa o Haskell 9.4, mas força o uso de um sistema operativo mais recente (Debian Bookworm)
FROM haskell:9.4-bookworm

# Define a pasta de trabalho no servidor
WORKDIR /app

# ATUALIZAÇÃO CRUCIAL: Instala as bibliotecas modernas do PostgreSQL no sistema Linux
RUN apt-get update && apt-get install -y libpq-dev

# Copia os ficheiros do projeto para o servidor
COPY . .

# Atualiza o Cabal e compila o projeto
RUN cabal update
RUN cabal build

# Expõe a porta 8080 (a mesma que configurou no Main.hs)
EXPOSE 8080

# Comando para executar a aplicação em produção
CMD ["cabal", "run"]