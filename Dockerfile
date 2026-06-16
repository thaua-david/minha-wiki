# Agora que o seu .cabal permite (base < 5), usamos o Haskell 9.6 (com Linux moderno)
FROM haskell:9.6

WORKDIR /app

# Como o Linux aqui é moderno, o comando simples volta a funcionar perfeitamente!
RUN apt-get update && apt-get install -y libpq-dev

COPY . .

RUN cabal update
RUN cabal build

EXPOSE 8080

CMD ["cabal", "run"]