# Usa a família 9.4 (que o seu código aceita), mas com um Linux atualizado nos bastidores do Render
FROM haskell:9.4

WORKDIR /app

# O Linux atualizado aceita este comando sem o erro 404
RUN apt-get update && apt-get install -y libpq-dev

COPY . .

RUN cabal update
# A flag --allow-newer é o nosso "escudo" para impedir que o Cabal bloqueie a compilação por limites de versão
RUN cabal build --allow-newer

EXPOSE 8080

CMD ["cabal", "run"]