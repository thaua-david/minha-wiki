{-# LANGUAGE OverloadedStrings #-}
module Database.Connection (obterConexao) where

import Database.PostgreSQL.Simple
import System.Environment (lookupEnv)
import Data.ByteString.Char8 (pack)

obterConexao :: IO Connection
obterConexao = do
    -- O Haskell procura a variável de ambiente da nuvem
    envUrl <- lookupEnv "DATABASE_URL"
    
    case envUrl of
        Just url -> do
            putStrLn "Iniciando em MODO PRODUÇÃO (Banco na Nuvem)..."
            connectPostgreSQL (pack url)
            
        Nothing -> do
            putStrLn "Iniciando em MODO DESENVOLVIMENTO (Banco Local)..."
            connect defaultConnectInfo 
                { connectHost     = "localhost"
                , connectDatabase = "wiki_garcia"
                , connectUser     = "postgres"
                , connectPassword = "thauaadm123" 
                }