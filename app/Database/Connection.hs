{-# LANGUAGE OverloadedStrings #-}
module Database.Connection (obterConexao) where

import Database.PostgreSQL.Simple

-- Função simples para conectar no banco
obterConexao :: IO Connection
obterConexao = connect defaultConnectInfo
    { connectHost     = "localhost"
    , connectDatabase = "wiki_garcia"
    , connectUser     = "postgres"
    , connectPassword = "thauaadm123" -- IMPORTANTE: Coloque a senha do seu pgAdmin aqui!
    }