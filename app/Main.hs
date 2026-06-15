{-# LANGUAGE OverloadedStrings #-}

module Main where

import Network.Wai.Handler.Warp (run)
import Servant (serve)

import Server.Handler (wikiAPI, server)
import Database.Connection (obterConexao)

main :: IO ()
main = do
    putStrLn "Conectando ao PostgreSQL..."
    conn <- obterConexao
    putStrLn "Servidor rodando na porta 8080! Acesse: http://localhost:8080/categorias"
    -- Iniciamos o servidor e passamos a conexão do banco para ele
    run 8080 (serve wikiAPI (server conn))