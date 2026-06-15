let artigoAtualId = null;
let quillRevisao; 
let conteudoHtmlSalvo = ""; 
let infoboxSalva = null; // Guarda o estado atual da tabela
let listaArtigosGlobal = []; 

document.addEventListener('DOMContentLoaded', () => {
    const BlockEmbed = Quill.import('blots/block/embed');
    class DividerBlot extends BlockEmbed { }
    DividerBlot.blotName = 'divider'; DividerBlot.tagName = 'hr';
    Quill.register(DividerBlot);

    const icons = Quill.import('ui/icons');
    icons['divider'] = '<svg viewBox="0 0 18 18"><line class="ql-stroke" x1="3" x2="15" y1="9" y2="9"></line></svg>';

    quillRevisao = new Quill('#editor-container', {
        theme: 'snow', placeholder: 'Comece a escrever a lore aqui...',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], 
                    [{ 'align': [] }], [{ 'color': [] }, { 'background': [] }], 
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['blockquote', 'code-block', 'divider'], 
                    ['link', 'image', 'video'], ['clean'] 
                ],
                handlers: {
                    'divider': function() {
                        const range = this.quill.getSelection(true);
                        this.quill.insertEmbed(range.index, 'divider', true, Quill.sources.USER);
                        this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
                    }
                }
            }
        }
    });

    construirMenuFandom();
});

// ==========================================
// ROTEAMENTO
// ==========================================
function verificarURL() {
    const hash = window.location.hash; 
    if (hash === '#admin') { mudarTela('admin', false); carregarDadosAdmin(); } 
    else if (hash === '#mudancas') { mudarTela('mudancas', false); carregarHistoricoGeral(); }
    else if (hash.startsWith('#artigo-')) {
        const idArt = parseInt(hash.replace('#artigo-', ''));
        const art = listaArtigosGlobal.find(a => a.idArtigo === idArt);
        if (art) abrirArtigo(idArt, art.titulo, false); else mudarTela('home', false); 
    } 
    else if (hash.startsWith('#imagem-')) {
        const partes = hash.replace('#imagem-', '').split('-');
        const art = listaArtigosGlobal.find(a => a.idArtigo === parseInt(partes[0]));
        if (art) abrirPaginaImagem(parseInt(partes[0]), art.titulo, parseInt(partes[1])); else mudarTela('home', false);
    }
    else { mudarTela('home', false); }
}

window.addEventListener('hashchange', verificarURL);

function mudarTela(idTela, mudarHash = true) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    document.getElementById('tela-' + idTela).classList.add('ativa');
    if (mudarHash) {
        if (idTela === 'home') { window.location.hash = ''; }
        if (idTela === 'admin') window.location.hash = '#admin';
        if (idTela === 'mudancas') window.location.hash = '#mudancas';
    }
}

// ==========================================
// MENU CASCATA (Mantido intacto)
// ==========================================
// ==========================================
// MENU CASCATA (COM SISTEMA ANTI-ÓRFÃOS)
// ==========================================
async function construirMenuFandom() {
    try {
        const [resCat, resArt] = await Promise.all([fetch('/api/categorias'), fetch('/api/artigos')]);
        const categorias = await resCat.json(); const artigos = await resArt.json();
        listaArtigosGlobal = artigos; 

        const menuDinamico = document.getElementById('menu-dinamico');
        const selectCatPai = document.getElementById('cat-pai');
        const selectCatArtigo = document.getElementById('art-categoria');
        
        menuDinamico.innerHTML = ''; 
        selectCatPai.innerHTML = '<option value="">Nenhuma (Criar como Categoria Principal)</option>';
        selectCatArtigo.innerHTML = '<option value="">Selecione a Pasta ou Categoria...</option>';

        // NOVO: Mapeia todos os IDs de categorias que existem para achar os órfãos
        const idsCategoriasExistentes = categorias.map(c => c.idCategoria);
        const artigosOrfaos = artigos.filter(art => !idsCategoriasExistentes.includes(art.idCatFK));

        const categoriasPrincipais = categorias.filter(c => c.parentId === null);
        categoriasPrincipais.forEach(cat => {
            selectCatPai.insertAdjacentHTML('beforeend', `<option value="${cat.idCategoria}">${cat.nome}</option>`);
            selectCatArtigo.insertAdjacentHTML('beforeend', `<option value="${cat.idCategoria}">📁 Principal: ${cat.nome}</option>`);
            const subcategorias = categorias.filter(sub => sub.parentId === cat.idCategoria);
            subcategorias.forEach(sub => { selectCatArtigo.insertAdjacentHTML('beforeend', `<option value="${sub.idCategoria}">&nbsp;&nbsp;&nbsp;↳ 📂 Sub: ${sub.nome}</option>`); });

            const liNav = document.createElement('li'); liNav.innerHTML = `<a href="javascript:void(0)">${cat.nome} &#9662;</a>`;
            const ulDropdown = document.createElement('ul'); ulDropdown.className = 'dropdown-content';
            let temQualquerConteudo = false;

            subcategorias.forEach(sub => {
                const artigosDestaSub = artigos.filter(art => art.idCatFK === sub.idCategoria);
                if (artigosDestaSub.length > 0) temQualquerConteudo = true;
                const liSub = document.createElement('li'); liSub.className = 'has-submenu'; liSub.innerHTML = `<a href="javascript:void(0)">📂 ${sub.nome}</a>`;
                const ulSubmenu = document.createElement('ul'); ulSubmenu.className = 'submenu-content';
                if (artigosDestaSub.length > 0) {
                    artigosDestaSub.forEach(art => { const liArtIn = document.createElement('li'); liArtIn.innerHTML = `<a href="#artigo-${art.idArtigo}">📄 ${art.titulo}</a>`; ulSubmenu.appendChild(liArtIn); });
                } else { ulSubmenu.innerHTML = '<li><a href="javascript:void(0)" style="color: #666; font-style: italic; padding: 12px 16px;">(Vazia)</a></li>'; }
                liSub.appendChild(ulSubmenu); ulDropdown.appendChild(liSub);
            });

            const artigosDiretos = artigos.filter(art => art.idCatFK === cat.idCategoria && idsCategoriasExistentes.includes(art.idCatFK));
            if (artigosDiretos.length > 0) temQualquerConteudo = true;
            if (subcategorias.length > 0 && artigosDiretos.length > 0) {
                const divisorLi = document.createElement('li'); divisorLi.innerHTML = `<span style="display:block; padding:8px 16px; color:#777; font-weight:bold; font-size:11px; border-bottom:1px solid #222; background:#141414; letter-spacing: 1px;">OUTROS ARTIGOS</span>`; ulDropdown.appendChild(divisorLi);
            }

            artigosDiretos.forEach(art => { const liArtDireto = document.createElement('li'); liArtDireto.innerHTML = `<a href="#artigo-${art.idArtigo}">📄 ${art.titulo}</a>`; ulDropdown.appendChild(liArtDireto); });
            if (!temQualquerConteudo) { ulDropdown.innerHTML = '<li><a href="javascript:void(0)" style="color: #666; font-style: italic;">(Pasta Vazia)</a></li>'; }
            liNav.appendChild(ulDropdown); menuDinamico.appendChild(liNav);
        });

        // ==========================================
        // NOVO: ABA DINÂMICA DE RECUPERADOS (ÓRFÃOS)
        // ==========================================
        if (artigosOrfaos.length > 0) {
            const liOrfao = document.createElement('li'); 
            liOrfao.innerHTML = `<a href="javascript:void(0)" style="color: #e74c3c;">⚠️ RECUPERADOS &#9662;</a>`;
            const ulOrfao = document.createElement('ul'); 
            ulOrfao.className = 'dropdown-content';
            ulOrfao.style.borderTop = "2px solid #e74c3c"; 
            
            const infoLi = document.createElement('li');
            infoLi.innerHTML = `<span style="display:block; padding:8px 16px; color:#aaa; font-size:11px; border-bottom:1px solid #333; background:#111;">Artigos sem categoria. Edite-os para realocar.</span>`;
            ulOrfao.appendChild(infoLi);

            artigosOrfaos.forEach(art => {
                const liArt = document.createElement('li');
                liArt.innerHTML = `<a href="#artigo-${art.idArtigo}">📄 ${art.titulo}</a>`;
                ulOrfao.appendChild(liArt);
            });
            
            liOrfao.appendChild(ulOrfao); 
            menuDinamico.appendChild(liOrfao);
        }

        verificarURL();
    } catch (e) { console.error(e); }
}

async function carregarHistoricoGeral() {
    try {
        const res = await fetch('/api/historico'); const todasRevisoes = await res.json();
        const container = document.getElementById('home-historico-lista'); if (!container) return;
        if (todasRevisoes.length === 0) { container.innerHTML = "<p>Ainda não há dados na Wiki.</p>"; return; }
        const revsPorArtigo = {};
        todasRevisoes.forEach(r => { if (!revsPorArtigo[r.artigoId]) revsPorArtigo[r.artigoId] = []; revsPorArtigo[r.artigoId].push(r); });
        container.innerHTML = "";
        const ultimasRevisoes = todasRevisoes.slice(0, 15);
        ultimasRevisoes.forEach(rev => {
            const art = listaArtigosGlobal.find(a => a.idArtigo === rev.artigoId); if (!art) return;
            const grupoArtigo = revsPorArtigo[rev.artigoId]; const indexNoGrupo = grupoArtigo.findIndex(r => r.idRevisao === rev.idRevisao);
            let diffHTML = ""; let tamanhoAtual = rev.conteudo.length;
            if (indexNoGrupo !== -1 && indexNoGrupo + 1 < grupoArtigo.length) {
                let tamanhoAnterior = grupoArtigo[indexNoGrupo + 1].conteudo.length; let calculo = tamanhoAtual - tamanhoAnterior;
                if (calculo > 0) diffHTML = `<span class="diff-positivo">+${calculo}</span>`; else if (calculo < 0) diffHTML = `<span class="diff-negativo">${calculo}</span>`; else diffHTML = `<span class="diff-neutro">0</span>`;
            } else { diffHTML = `<span class="diff-positivo">+${tamanhoAtual}</span>`; }
            const item = document.createElement('div'); item.className = "history-item history-item-global"; item.onclick = () => { window.location.hash = `#artigo-${art.idArtigo}`; };
            item.innerHTML = `<div style="display: flex; align-items: center;"><span style="font-size: 20px; margin-right: 15px;">📄</span><div><strong style="color: #f1c40f; font-size: 15px;">${art.titulo}</strong><div style="font-size: 12px; color: #999; margin-top: 2px;">Atualizado na Versão ${rev.versao} (Registro #${rev.idRevisao})</div></div></div><div style="font-size: 14px; background: #2a2a2a; padding: 5px 10px; border-radius: 4px; border: 1px solid #444;">${diffHTML} bytes</div>`;
            container.appendChild(item);
        });
    } catch (e) { console.error(e); }
}

// ==========================================
// INFOBOX: RENDERIZADOR DINÂMICO
// ==========================================
function renderizarInfoboxHTML(info) {
    if (!info || !info.titulo) return '';
    
    // Constrói a estrutura HTML da tabela flutuante idêntica à do Fandom
    let html = `<aside class="fandom-infobox">`;
    html += `<h2 class="infobox-title">${info.titulo}</h2>`;
    
    if (info.img1) {
        html += `<div class="infobox-img-container"><img id="info-display-img-${artigoAtualId}" src="${info.img1}" /></div>`;
        if (info.img2) {
            // As abas mágicas que trocam a imagem no clique
            html += `<div class="infobox-tabs">
                        <button onclick="document.getElementById('info-display-img-${artigoAtualId}').src='${info.img1}'">Principal</button>
                        <button onclick="document.getElementById('info-display-img-${artigoAtualId}').src='${info.img2}'">Alternativa</button>
                     </div>`;
        }
    }
    
    if (info.atributos && info.atributos.length > 0) {
        html += `<table class="infobox-table"><tbody>`;
        info.atributos.forEach(attr => { html += `<tr><th>${attr.k}</th><td>${attr.v}</td></tr>`; });
        html += `</tbody></table>`;
    }
    html += `</aside>`;
    return html;
}

// ==========================================
// INFOBOX: GERENCIADOR DO MODO EDIÇÃO
// ==========================================
function adicionarCampoInfobox(chave = '', valor = '') {
    const container = document.getElementById('infobox-campos');
    const div = document.createElement('div');
    div.className = 'infobox-campo-row';
    div.innerHTML = `<input type="text" placeholder="Atributo (Ex: Raça)" value="${chave}" class="info-k" style="flex: 1;">
                     <input type="text" placeholder="Valor (Ex: Humano)" value="${valor}" class="info-v" style="flex: 2;">
                     <button type="button" onclick="this.parentElement.remove()" style="background:#e74c3c; padding:8px;">X</button>`;
    container.appendChild(div);
}

function carregarFormularioInfobox(info) {
    document.getElementById('info-titulo').value = info ? info.titulo : '';
    document.getElementById('info-img1').value = info ? (info.img1 || '') : '';
    document.getElementById('info-img2').value = info ? (info.img2 || '') : '';
    document.getElementById('infobox-campos').innerHTML = ''; // Limpa antes de popular
    if (info && info.atributos) {
        info.atributos.forEach(a => adicionarCampoInfobox(a.k, a.v));
    }
}

// ==========================================
// LEITURA, ÍNDICE E EDIÇÃO
// ==========================================
async function abrirArtigo(idArtigo, titulo, mudarHash = true) {
    artigoAtualId = idArtigo; mudarTela('artigo', false); if (mudarHash) window.location.hash = '#artigo-' + idArtigo;
    document.getElementById('modo-leitura').style.display = 'block'; document.getElementById('modo-edicao').style.display = 'none'; document.getElementById('modo-historico').style.display = 'none'; document.getElementById('btn-editar-artigo').style.display = 'block'; 
    document.getElementById('artigo-titulo').textContent = titulo; document.getElementById('artigo-conteudo').innerHTML = "<em>Buscando...</em>"; document.getElementById('artigo-indice').style.display = 'none'; 
    
    try {
        const res = await fetch(`/api/artigos/${idArtigo}/revisoes`); const revisoes = await res.json();
        if (revisoes.length > 0) {
            let conteudoCru = revisoes[0].conteudo;
            
            // MAGIA DO SEPARADOR: Desacopla o HTML do Quill do JSON da Infobox
            let partes = conteudoCru.split("|||INFOBOX|||");
            conteudoHtmlSalvo = partes[0]; // Isso vai pro Quill
            
            infoboxSalva = null;
            if (partes[1]) {
                try { infoboxSalva = JSON.parse(decodeURIComponent(escape(atob(partes[1])))); } catch(e){ console.error("Erro ao ler infobox", e); }
            }

            // Junta a tabela flutuante com o texto para exibição
            let htmlFinal = renderizarInfoboxHTML(infoboxSalva) + conteudoHtmlSalvo;
            
            document.getElementById('artigo-conteudo').innerHTML = htmlFinal;
            document.getElementById('artigo-historico').textContent = `Visualizando Versão ${revisoes[0].versao}`;
            gerarIndice();
            document.querySelectorAll('#artigo-conteudo img').forEach((img, idx) => { img.onclick = () => abrirModalImagem(img.src, idArtigo, idx); });
        } else {
            conteudoHtmlSalvo = ""; infoboxSalva = null;
            document.getElementById('artigo-conteudo').innerHTML = "<em>Vazio! Clique em 'Editar'.</em>";
            document.getElementById('artigo-historico').textContent = "Sem edições.";
        }
    } catch (e) { console.error(e); }
}

function ativarModoEdicao() { 
    document.getElementById('modo-leitura').style.display = 'none'; 
    document.getElementById('modo-edicao').style.display = 'block'; 
    document.getElementById('modo-historico').style.display = 'none'; 
    document.getElementById('btn-editar-artigo').style.display = 'none'; 
    
    // Carrega o texto puro no editor
    quillRevisao.root.innerHTML = conteudoHtmlSalvo; 
    
    // Carrega os dados da tabela nos campos do lado direito
    carregarFormularioInfobox(infoboxSalva);
}
function cancelarEdicao() { abrirArtigo(artigoAtualId, document.getElementById('artigo-titulo').textContent); }

// ==========================================
// SALVANDO A MAGIA (COM INFOBOX)
// ==========================================
document.getElementById('form-revisao').addEventListener('submit', async (e) => {
    e.preventDefault(); if (!artigoAtualId) return; 
    const novoConteudoHtml = quillRevisao.root.innerHTML;
    if (novoConteudoHtml === "<p><br></p>" || novoConteudoHtml.trim() === "") return alert("O artigo não pode estar vazio!");
    
    // 1. Coleta os dados da Tabela do formulário
    let tituloInfo = document.getElementById('info-titulo').value.trim();
    let dadosInfoboxStr = "";
    
    if (tituloInfo !== '') {
        let infoboxObj = {
            titulo: tituloInfo,
            img1: document.getElementById('info-img1').value.trim(),
            img2: document.getElementById('info-img2').value.trim(),
            atributos: []
        };
        document.querySelectorAll('.infobox-campo-row').forEach(row => {
            let k = row.querySelector('.info-k').value.trim();
            let v = row.querySelector('.info-v').value.trim();
            if (k !== '') infoboxObj.atributos.push({k, v});
        });
        
        // Criptografa o JSON em Base64 para anexar no fim do texto sem quebrar nada
        dadosInfoboxStr = "|||INFOBOX|||" + btoa(unescape(encodeURIComponent(JSON.stringify(infoboxObj))));
    }

    // 2. Monta o pacote: HTML + SEPARADOR + BASE64
    let pacoteFinal = novoConteudoHtml + dadosInfoboxStr;

    await fetch(`/api/artigos/${artigoAtualId}/revisoes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nrConteudo: pacoteFinal }) });
    abrirArtigo(artigoAtualId, document.getElementById('artigo-titulo').textContent); 
});

// ==========================================
// RESTO DO SISTEMA (Telas, Admin, Modais, Índices)
// ==========================================
function abrirModalImagem(srcBase64, idArt, indexImg) { document.getElementById('modal-img-tag').src = srcBase64; document.getElementById('modal-link-detalhes').onclick = (e) => { e.preventDefault(); fecharModal(); window.location.hash = `#imagem-${idArt}-${indexImg}`; }; document.getElementById('modal-imagem').classList.add('ativo'); }
function fecharModal() { document.getElementById('modal-imagem').classList.remove('ativo'); }

async function abrirPaginaImagem(idArtigo, tituloArtigo, indexImg) {
    mudarTela('imagem', false); 
    document.getElementById('pagina-imagem-titulo').textContent = `Imagem de: ${tituloArtigo}`;
    try {
        const res = await fetch(`/api/artigos/${idArtigo}/revisoes`); 
        const revs = await res.json();
        if (revs.length > 0) { 
            let conteudoCru = revs[0].conteudo;
            let partes = conteudoCru.split("|||INFOBOX|||");
            let htmlQuill = partes[0];
            let infoObj = null;
            if (partes[1]) {
                try { infoObj = JSON.parse(decodeURIComponent(escape(atob(partes[1])))); } catch(e){}
            }
            
            // Reconstrói o HTML completo com a Infobox para que o índice de contagem da imagem coincida perfeitamente
            const temp = document.createElement('div'); 
            temp.innerHTML = renderizarInfoboxHTML(infoObj) + htmlQuill;
            
            const imgs = temp.querySelectorAll('img'); 
            if (imgs[indexImg]) {
                document.getElementById('pagina-imagem-tag').src = imgs[indexImg].src; 
            }
        }
    } catch (e) { console.error(e); }
}

function gerarIndice() {
    const cnt = document.getElementById('artigo-conteudo'); const ind = document.getElementById('artigo-indice');
    const cab = cnt.querySelectorAll('h1, h2, h3'); if (cab.length === 0) { ind.style.display = 'none'; return; }
    ind.style.display = 'table'; ind.innerHTML = '<div class="toc-titulo">Índice</div><ul class="toc-lista"></ul>';
    const lista = ind.querySelector('.toc-lista');
    cab.forEach((c, i) => { const id = `secao-${i}`; c.id = id; const li = document.createElement('li'); li.className = `toc-item-${c.tagName.toLowerCase()}`; const a = document.createElement('a'); a.href = `#${id}`; a.textContent = c.textContent; a.onclick = (e) => { e.preventDefault(); document.getElementById(id).scrollIntoView({ behavior: 'smooth' }); }; li.appendChild(a); lista.appendChild(li); });
}

async function carregarHistoricoArtigo() {
    if (!artigoAtualId) return; document.getElementById('modo-leitura').style.display = 'none'; document.getElementById('modo-edicao').style.display = 'none'; document.getElementById('modo-historico').style.display = 'block'; document.getElementById('btn-editar-artigo').style.display = 'none';
    const container = document.getElementById('historico-lista-container'); container.innerHTML = "<em>Processando...</em>";
    try {
        const res = await fetch(`/api/artigos/${artigoAtualId}/revisoes`); const revisoes = await res.json(); 
        if (revisoes.length === 0) { container.innerHTML = "<p>Nenhuma alteração.</p>"; return; }
        container.innerHTML = "";
        revisoes.forEach((rev, idx) => {
            let diffHTML = ""; let tamanhoAtual = rev.conteudo.length;
            if (idx + 1 < revisoes.length) {
                let calc = tamanhoAtual - revisoes[idx + 1].conteudo.length;
                if (calc > 0) diffHTML = `<span class="diff-positivo">(+${calc})</span>`; else if (calc < 0) diffHTML = `<span class="diff-negativo">(${calc})</span>`; else diffHTML = `<span class="diff-neutro">(0)</span>`;
            } else diffHTML = `<span class="diff-positivo">(+${tamanhoAtual})</span>`;
            const item = document.createElement('div'); item.className = "history-item"; item.innerHTML = `<div><strong style="color: #ccc;">Versão ${rev.versao}</strong> — Registro #${rev.idRevisao} <br> ${diffHTML} bytes.</div><button onclick="restaurarVersao('${btoa(unescape(encodeURIComponent(rev.conteudo)))}')" class="btn-verde">Restaurar</button>`; container.appendChild(item);
        });
    } catch (e) { console.error(e); }
}

async function restaurarVersao(conteudoBase64) {
    const txt = decodeURIComponent(escape(atob(conteudoBase64)));
    if (!confirm("Reverter a página para esta versão?")) return;
    try { await fetch(`/api/artigos/${artigoAtualId}/revisoes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nrConteudo: txt }) }); abrirArtigo(artigoAtualId, document.getElementById('artigo-titulo').textContent); } catch (e) { console.error(e); }
}

async function carregarDadosAdmin() {
    try {
        const [resCat, resArtAtivos, resArtInativos] = await Promise.all([fetch('/api/categorias'), fetch('/api/artigos'), fetch('/api/artigos/inativos')]);
        const categorias = await resCat.json(); const ativos = await resArtAtivos.json(); const inativos = await resArtInativos.json();
        const ulCat = document.getElementById('admin-lista-categorias'); ulCat.innerHTML = ""; categorias.forEach(c => { const li = document.createElement('li'); li.innerHTML = `<span><strong style="color: #ccc;">${c.nome}</strong></span><button onclick="deletarCategoria(${c.idCategoria})" class="btn-delete-vermelho">Apagar</button>`; ulCat.appendChild(li); });
        const ulArt = document.getElementById('admin-lista-artigos'); ulArt.innerHTML = ""; ativos.forEach(a => { const li = document.createElement('li'); li.innerHTML = `<span style="color: #ccc;">${a.titulo}</span><button onclick="deletarArtigo(${a.idArtigo})" class="btn-delete-vermelho">Mover p/ Lixeira</button>`; ulArt.appendChild(li); });
        const ulLixeira = document.getElementById('admin-lixeira-artigos'); ulLixeira.innerHTML = inativos.length === 0 ? "<li>Vazia</li>" : ""; inativos.forEach(a => { const li = document.createElement('li'); li.innerHTML = `<span style="text-decoration: line-through; color: #777;">${a.titulo}</span><button onclick="recuperarArtigo(${a.idArtigo})" class="btn-verde">Restaurar</button>`; ulLixeira.appendChild(li); });
    } catch (e) { console.error(e); }
}
// ==========================================
// ADMIN: DELETE & LIXEIRA (CORRIGIDO REFRESH)
// ==========================================
async function deletarCategoria(id) { 
    if (!confirm("Apagar categoria?")) return; 
    await fetch(`/api/categorias/${id}`, { method: 'DELETE' }); 
    construirMenuFandom(); 
    carregarDadosAdmin(); // CORREÇÃO: Atualiza o painel admin instantaneamente!
}

async function deletarArtigo(id) { 
    if (!confirm("Mover para lixeira?")) return; 
    await fetch(`/api/artigos/${id}`, { method: 'DELETE' }); 
    construirMenuFandom(); 
    carregarDadosAdmin(); // CORREÇÃO: Atualiza o painel admin instantaneamente!
}

async function recuperarArtigo(id) { 
    await fetch(`/api/artigos/${id}/restaurar`, { method: 'POST' }); 
    alert("Artigo recuperado com sucesso!"); 
    construirMenuFandom(); 
    carregarDadosAdmin(); // CORREÇÃO: Atualiza o painel admin instantaneamente!
}

document.getElementById('form-categoria').addEventListener('submit', async (e) => {
    e.preventDefault(); const catPaiValor = document.getElementById('cat-pai').value; const parentIdReal = catPaiValor === "" ? null : parseInt(catPaiValor);
    await fetch('/api/categorias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ncNome: document.getElementById('cat-nome').value, ncDescricao: document.getElementById('cat-desc').value || null, ncParentId: parentIdReal }) });
    document.getElementById('form-categoria').reset(); construirMenuFandom();
});
document.getElementById('form-artigo').addEventListener('submit', async (e) => {
    e.preventDefault(); await fetch('/api/artigos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ naTitulo: document.getElementById('art-titulo').value, naIdCatFK: parseInt(document.getElementById('art-categoria').value) }) });
    document.getElementById('form-artigo').reset(); construirMenuFandom();
});