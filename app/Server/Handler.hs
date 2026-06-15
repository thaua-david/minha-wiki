{-# LANGUAGE DataKinds #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE OverloadedStrings #-}

module Server.Handler where

import Servant
import Control.Monad.IO.Class (liftIO)
import Database.PostgreSQL.Simple (Connection)

import Models.Wiki (Categoria, NovaCategoria, Artigo, NovoArtigo, Revisao, NovaRevisao)
import Database.Queries

-- 1. Agrupamos toda a nossa API de dados isolada
type ApiRoutes =
         "categorias" :> Get '[JSON] [Categoria]
    :<|> "categorias" :> ReqBody '[JSON] NovaCategoria :> Post '[JSON] Categoria
    :<|> "categorias" :> Capture "id" Int :> Delete '[JSON] ()
    :<|> "artigos"    :> Get '[JSON] [Artigo]
    :<|> "artigos"    :> "inativos" :> Get '[JSON] [Artigo]
    :<|> "artigos"    :> ReqBody '[JSON] NovoArtigo :> Post '[JSON] Artigo
    :<|> "artigos"    :> Capture "id" Int :> Delete '[JSON] Artigo
    :<|> "artigos"    :> Capture "id" Int :> "restaurar" :> Post '[JSON] Artigo
    :<|> "artigos"    :> Capture "id" Int :> "revisoes" :> Get '[JSON] [Revisao]
    :<|> "artigos"    :> Capture "id" Int :> "revisoes" :> ReqBody '[JSON] NovaRevisao :> Post '[JSON] Revisao
    :<|> "historico"  :> Get '[JSON] [Revisao]

-- 2. Planta Baixa: O que tiver "api/" vai para os dados, o resto (Raw) vai para a pasta public
type WikiAPI = ("api" :> ApiRoutes) :<|> Raw

server :: Connection -> Server WikiAPI
server conn = apiServer :<|> rotaFrontend
  where
    -- Conecta as rotas da API com as funções do banco
    apiServer =
             rotaListarCat
        :<|> rotaCriarCat
        :<|> rotaDeletarCat
        :<|> rotaListarArt
        :<|> rotaListarArtInativos
        :<|> rotaCriarArt
        :<|> rotaDeletarArt
        :<|> rotaRestaurarArt
        :<|> rotaListarRev
        :<|> rotaCriarRev
        :<|> rotaHistoricoGeral

    rotaListarCat            = liftIO (listarCategorias conn)
    rotaCriarCat dados       = liftIO (criarCategoria conn dados)
    rotaDeletarCat idCat     = liftIO (deletarCategoria conn idCat)
    rotaListarArt            = liftIO (listarArtigos conn)
    rotaListarArtInativos    = liftIO (listarArtigosInativos conn)
    rotaCriarArt dados       = liftIO (criarArtigo conn dados)
    rotaDeletarArt idArt     = liftIO (deletarArtigo conn idArt)
    rotaRestaurarArt idArt   = liftIO (restaurarArtigo conn idArt)
    rotaListarRev idArt      = liftIO (listarRevisoes conn idArt)
    rotaCriarRev idArt dados = liftIO (criarRevisao conn idArt dados)
    rotaHistoricoGeral       = liftIO (listarHistoricoGeral conn)

    -- O Servant possui inteligência nativa para servir o index.html na raiz
    rotaFrontend             = serveDirectoryWebApp "public"

wikiAPI :: Proxy WikiAPI
wikiAPI = Proxy