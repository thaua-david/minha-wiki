# 1. Em vez de usar imagens frágeis do Haskell, usamos um servidor Ubuntu 22.04 puro (Ultra estável)
FROM ubuntu:22.04

# 2. Desativa qualquer aviso interativo que possa travar a tela preta do Render
ENV DEBIAN_FRONTEND=noninteractive

# 3. O Pulo do Gato: Instalamos o PostgreSQL 14+ que já vem NATIVO no Ubuntu 22.04! Sem erros 404.
RUN apt-get update && apt-get install -y \
    curl build-essential libffi-dev libgmp-dev libpq-dev pkg-config

# 4. Baixamos o gerenciador oficial do Haskell (GHCup) e instalamos do zero
ENV BOOTSTRAP_HASKELL_NONINTERACTIVE=1
ENV BOOTSTRAP_HASKELL_MINIMAL=1
RUN curl --proto '=https' --tlsv1.2 -sSf https://get-ghcup.haskell.org | sh

# 5. Adicionamos o Haskell ao caminho do sistema
ENV PATH="/root/.ghcup/bin:$PATH"

# 6. Instalamos a versão exata do compilador (9.4) que sabemos que a sua Wiki adora
RUN ghcup install ghc 9.4.8 && ghcup set ghc 9.4.8
RUN ghcup install cabal 3.10.3.0 && ghcup set cabal 3.10.3.0

# 7. Copiamos o projeto e compilamos
WORKDIR /app
COPY . .

RUN cabal update
RUN cabal build

EXPOSE 8080
CMD ["cabal", "run"]