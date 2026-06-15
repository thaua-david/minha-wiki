# Usa uma imagem oficial e enxuta do Haskell
FROM haskell:9.4.4

# Define a pasta de trabalho no servidor da nuvem
WORKDIR /app

# Copia os arquivos do projeto para o servidor
COPY . .

# Atualiza e compila o projeto
RUN cabal update
RUN cabal build

# Expõe a porta 8080 (a mesma que você configurou na Main.hs)
EXPOSE 8080

# Comando para rodar a aplicação em produção
CMD ["cabal", "run"]