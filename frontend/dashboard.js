// --- 1. Verificação de Segurança (ATUALIZADA) ---
// Pegamos o token REAL que o login.js salvou
const token = localStorage.getItem('admin_token');

// Se o token NÃO EXISTIR, chuta de volta para o login
if (!token) {
    window.location.href = 'login.html';
}

// --- 2. Simulação do Banco de Dados (REMOVIDA) ---
// const DADOS_ADMIN = [...]; <-- REMOVEMOS ISSO

// --- 3. Função para Renderizar o Ranking (ATUALIZADA) ---
// (A lógica interna não muda, só os nomes dos campos que vêm do backend)
function renderizarRanking(dadosOrdenados) {
    const rankingList = document.getElementById('ranking-list');
    if (!rankingList) return;

    rankingList.innerHTML = ''; // Limpa a lista

    // 3. Renderiza os cards na tela
    dadosOrdenados.forEach((opiniao, index) => {
        const rank = index + 1; // 1, 2, 3...
        
        const li = document.createElement('li');
        li.className = `ranking-card rank-${rank}`;

        // Calcula as porcentagens para as barras
        const { votos_apoiar, votos_neutro, votos_contra, pontos } = opiniao;
        const totalVotos = votos_apoiar + votos_neutro + votos_contra;

        const pctApoiar = totalVotos > 0 ? (votos_apoiar / totalVotos) * 100 : 0;
        const pctNeutro = totalVotos > 0 ? (votos_neutro / totalVotos) * 100 : 0;
        const pctContra = totalVotos > 0 ? (votos_contra / totalVotos) * 100 : 0;

        li.innerHTML = `
            <div class="ranking-position">
                <i class="fas fa-crown"></i>
                <i class="fas fa-medal"></i>
                <span class="rank-number">#${rank}</span>
            </div>
            
            <div class="ranking-details">
                <p class="opinion-text">${opiniao.texto_opiniao}</p>
                <div class="opinion-meta">
                    <span><strong>Autor:</strong> ${opiniao.autor}</span>
                    <span><strong>Data:</strong> ${new Date(opiniao.data_envio).toLocaleDateString('pt-BR')}</span>
                </div>
                <div class="graph-legend">
                    <span><span class="dot apoiar"></span>${votos_apoiar} Apoios</span>
                    <span><span class="dot neutro"></span>${votos_neutro} Neutro</span>
                    <span><span class="dot contra"></span>${votos_contra} Contras</span>
                </div>
                <div class="graph-container">
                    <div class="graph-bar bar-apoiar" style="width: ${pctApoiar}%;"></div>
                    <div class="graph-bar bar-neutro" style="width: ${pctNeutro}%;"></div>
                    <div class="graph-bar bar-contra" style="width: ${pctContra}%;"></div>
                </div>
            </div>

            <div class="ranking-score">
                <span class="score-number">${pontos}</span>
                <span class="score-label">Pontos</span>
            </div>
        `;
        
        rankingList.appendChild(li);
    });
}


// --- 4. Inicialização (ATUALIZADA) ---
document.addEventListener('DOMContentLoaded', async () => {
    // A função de renderizar é a mesma, mas agora chamamos o backend
    
    // NOVO: Chama a rota protegida do backend
    try {
        const response = await fetch('http://localhost:3000/admin/dashboard', {
            method: 'GET',
            headers: {
                // ANEXA O TOKEN para provar que estamos logados
                'Authorization': `Bearer ${token}` 
            }
        });

        if (response.status === 401 || response.status === 403) {
            // Se o token for inválido ou expirado, chuta para o login
            alert('Sua sessão expirou. Por favor, faça login novamente.');
            localStorage.removeItem('admin_token'); // Limpa o token antigo
            window.location.href = 'login.html';
            return; // Para a execução
        }
        
        if (!response.ok) {
            throw new Error('Falha ao carregar dados do dashboard.');
        }

        // Se deu tudo certo, pega os dados REAIS do backend
        const rankingDoBackend = await response.json();

        // Renderiza o ranking com os dados reais
        renderizarRanking(rankingDoBackend);

    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
    }
});