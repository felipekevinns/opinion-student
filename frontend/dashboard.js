const token = localStorage.getItem('admin_token');


if (!token) {
    window.location.href = 'login.html';
}

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
                <div class="delete-icon-wrapper" data-delete-id="${opiniao.id}">
                    <i class="fas fa-trash-alt"></i>
                </div>
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


document.addEventListener('DOMContentLoaded', async () => {
    // A função de renderizar é a mesma, mas agora chamamos o backend
    
    // NOVO: Chama a rota protegida do backend
    try {
        const response = await fetch('https://opinion-student-backend.onrender.com/admin/dashboard', {
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
            return;
        }
        
        if (!response.ok) {
            throw new Error('Falha ao carregar dados do dashboard.');
        }

        const rankingDoBackend = await response.json();

        renderizarRanking(rankingDoBackend);

    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
    }
});

async function handleDeleteClick(event) {
    // 1. Acha o ícone exato que foi clicado
    const lixeira = event.target.closest('.delete-icon-wrapper');
    
    // Se o clique não foi na lixeira, não faz nada
    if (!lixeira) return;

    // 2. Pega o ID que "carimbamos" no ícone
    const opiniaoId = lixeira.dataset.deleteId;

    // 3. Pede Confirmação (MUITO IMPORTANTE!)
    const confirmar = window.confirm('Você tem certeza que deseja excluir esta opinião? Esta ação não pode ser desfeita.');

    // Se o admin clicar em "Cancelar", a função para
    if (!confirmar) return;

    // 4. Se confirmou, começa o processo de exclusão
    try {
        // Pega o token salvo no Local Storage
        const token = localStorage.getItem('admin_token');
        if (!token) {
            alert('Erro: Token não encontrado. Faça login novamente.');
            window.location.href = 'login.html';
            return;
        }

        // 5. Chama a nova rota DELETE no backend
        const response = await fetch(`https://opinion-student-backend.onrender.com/admin/opiniao/${opiniaoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}` // Envia o token de admin
            }
        });

        // 6. Analisa a resposta
        if (response.status === 204) {
            // Sucesso! (204 No Content)
            // Remove o card da tela para o admin ver
            lixeira.closest('.ranking-card').remove();
            
        } else if (response.status === 404) {
            alert('Erro: Opinião não encontrada no banco de dados.');
        } else {
            // Outros erros (500, etc)
            throw new Error('Falha ao excluir. O servidor respondeu com um erro.');
        }

    } catch (error) {
        console.error('Erro ao deletar:', error);
        alert(error.message);
    }
}

// 7. Adiciona o "ouvinte" de cliques na lista
// (Isso é feito uma vez, logo após o DOM carregar)
document.addEventListener('DOMContentLoaded', () => {
    const lista = document.getElementById('ranking-list');
    if (lista) {
        lista.addEventListener('click', handleDeleteClick);
    }
});