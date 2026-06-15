{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE DeriveAnyClass #-}

module Models.Wiki where

import GHC.Generics (Generic)
import Data.Aeson (ToJSON, FromJSON) -- Biblioteca do Servant para JSON
import Database.PostgreSQL.Simple.FromRow (FromRow)
import Database.PostgreSQL.Simple.ToRow (ToRow)
import Data.Text (Text)

-- 1. O Modelo da Categoria (ATUALIZADO COM SUBCATEGORIAS)
data Categoria = Categoria
    { idCategoria :: Int
    , nome        :: Text
    , descricao   :: Maybe Text -- Maybe significa que pode ser nulo (NULL no banco)
    , parentId    :: Maybe Int  -- NOVO: O ID da categoria pai (se houver)
    } deriving (Show, Generic, ToJSON, FromJSON, FromRow, ToRow)

-- 2. O Modelo do Artigo
data Artigo = Artigo
    { idArtigo   :: Int
    , titulo     :: Text
    , idCatFK    :: Int
    , ativo      :: Bool
    } deriving (Show, Generic, ToJSON, FromJSON, FromRow, ToRow)

-- 3. O Modelo de Entrada (O que recebemos no POST) (ATUALIZADO COM SUBCATEGORIAS)
data NovaCategoria = NovaCategoria
    { ncNome      :: Text
    , ncDescricao :: Maybe Text
    , ncParentId  :: Maybe Int  -- NOVO: Permite enviar o ID do pai na criação
    } deriving (Show, Generic, ToJSON, FromJSON)

-- 4. O Modelo de Entrada do Artigo (O que recebemos no POST)
-- O usuário manda apenas o título e a qual categoria (id) ele pertence.
data NovoArtigo = NovoArtigo
    { naTitulo  :: Text
    , naIdCatFK :: Int
    } deriving (Show, Generic, ToJSON, FromJSON)

-- 5. O Modelo de Saída da Revisão (Como vem do banco)
data Revisao = Revisao
    { idRevisao :: Int
    , artigoId  :: Int
    , conteudo  :: Text
    , versao    :: Int
    } deriving (Show, Generic, ToJSON, FromJSON, FromRow, ToRow)

-- 6. O Modelo de Entrada (O usuário envia apenas o texto quando vai editar)
data NovaRevisao = NovaRevisao
    { nrConteudo :: Text
    } deriving (Show, Generic, ToJSON, FromJSON)