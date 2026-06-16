FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# O ÚNICO AJUSTE: Adicionámos o zlib1g-dev no final desta linha!
RUN apt-get update && apt-get install -y \
    curl build-essential libffi-dev libgmp-dev libpq-dev pkg-config zlib1g-dev

ENV BOOTSTRAP_HASKELL_NONINTERACTIVE=1
ENV BOOTSTRAP_HASKELL_MINIMAL=1
RUN curl --proto '=https' --tlsv1.2 -sSf https://get-ghcup.haskell.org | sh

ENV PATH="/root/.ghcup/bin:$PATH"

RUN ghcup install ghc 9.4.8 && ghcup set ghc 9.4.8
RUN ghcup install cabal 3.10.3.0 && ghcup set cabal 3.10.3.0

WORKDIR /app
COPY . .

RUN cabal update
RUN cabal build

EXPOSE 8080
CMD ["cabal", "run"]