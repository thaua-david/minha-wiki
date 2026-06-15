{-# LANGUAGE OverloadedStrings #-}
module Database.Queries where

import Database.PostgreSQL.Simple
import Models.Wiki (Categoria, NovaCategoria(..), Artigo, NovoArtigo(..), Revisao, NovaRevisao(..))


-- ==========================================
-- CATEGORIAS (ATUALIZADO COM SUBCATEGORIAS)
-- ==========================================
listarCategorias :: Connection -> IO [Categoria]
listarCategorias conn = query_ conn "SELECT id, nome, descricao, parent_id FROM categorias"

criarCategoria :: Connection -> NovaCategoria -> IO Categoria
criarCategoria conn (NovaCategoria n d pid) = do
    let sql = "INSERT INTO categorias (nome, descricao, parent_id) VALUES (?, ?, ?) RETURNING id, nome, descricao, parent_id"
    resultados <- query conn sql (n, d, pid)
    return (head resultados)

deletarCategoria :: Connection -> Int -> IO ()
deletarCategoria conn idCat = do
    _ <- execute conn "DELETE FROM categorias WHERE id = ?" (Only idCat)
    return ()

-- ==========================================
-- ARTIGOS (SOFT DELETE & RESTORE)
-- ==========================================
listarArtigos :: Connection -> IO [Artigo]
listarArtigos conn = query_ conn "SELECT id, titulo, categoria_id, ativo FROM artigos WHERE ativo = true"

listarArtigosInativos :: Connection -> IO [Artigo]
listarArtigosInativos conn = query_ conn "SELECT id, titulo, categoria_id, ativo FROM artigos WHERE ativo = false"

criarArtigo :: Connection -> NovoArtigo -> IO Artigo
criarArtigo conn (NovoArtigo t c) = do
    let sql = "INSERT INTO artigos (titulo, categoria_id) VALUES (?, ?) RETURNING id, titulo, categoria_id, ativo"
    resultados <- query conn sql (t, c)
    return (head resultados)

deletarArtigo :: Connection -> Int -> IO Artigo
deletarArtigo conn idArt = do
    let sql = "UPDATE artigos SET ativo = false WHERE id = ? RETURNING id, titulo, categoria_id, ativo"
    resultados <- query conn sql (Only idArt)
    return (head resultados)

restaurarArtigo :: Connection -> Int -> IO Artigo
restaurarArtigo conn idArt = do
    let sql = "UPDATE artigos SET ativo = true WHERE id = ? RETURNING id, titulo, categoria_id, ativo"
    resultados <- query conn sql (Only idArt)
    return (head resultados)

-- ==========================================
-- REVISÕES E HISTÓRICO
-- ==========================================
listarRevisoes :: Connection -> Int -> IO [Revisao]
listarRevisoes conn idArt = 
    query conn "SELECT id, artigo_id, conteudo, versao FROM revisoes WHERE artigo_id = ? ORDER BY versao DESC" (Only idArt)

criarRevisao :: Connection -> Int -> NovaRevisao -> IO Revisao
criarRevisao conn idArt (NovaRevisao cont) = do
    let sql = "INSERT INTO revisoes (artigo_id, conteudo, versao) \
              \VALUES (?, ?, COALESCE((SELECT MAX(versao) FROM revisoes WHERE artigo_id = ?), 0) + 1) \
              \RETURNING id, artigo_id, conteudo, versao"
    resultados <- query conn sql (idArt, cont, idArt)
    return (head resultados)

-- NOVA REGRA DE NEGÓCIO: Histórico Geral da Home
listarHistoricoGeral :: Connection -> IO [Revisao]
listarHistoricoGeral conn =
    -- Pega todas as edições, unindo com a tabela de artigos para garantir que o artigo ainda está ativo (não está na lixeira)
    query_ conn "SELECT r.id, r.artigo_id, r.conteudo, r.versao FROM revisoes r JOIN artigos a ON r.artigo_id = a.id WHERE a.ativo = true ORDER BY r.id DESC"