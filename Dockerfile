# 1. Mantemos a versão do Haskell que já sabemos que compila o seu código
FROM haskell:9.4.4

WORKDIR /app

# 2. Ensinamos o Linux a buscar a biblioteca moderna diretamente do site oficial do PostgreSQL
RUN apt-get update && apt-get install -y gnupg wget lsb-release && \
    wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | tee /etc/apt/trusted.gpg.d/pgdg.asc > /dev/null && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && apt-get install -y libpq-dev

# 3. Copia os seus ficheiros
COPY . .

# 4. Atualiza as dependências e compila o projeto
RUN cabal update
RUN cabal build

# 5. Expõe a porta e roda o servidor
EXPOSE 8080
CMD ["cabal", "run"]