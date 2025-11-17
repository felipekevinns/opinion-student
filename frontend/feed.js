// --- 1. Funções de Local Storage (Não mudou) ---
const VOTOS_KEY = 'opnionStudent_votos';

function getVotosSalvos() {
    const votos = localStorage.getItem(VOTOS_KEY);
    return votos ? JSON.parse(votos) : {};
}

function salvarVoto(opiniaoId, tipoVoto) {
    const votosSalvos = getVotosSalvos();
    votosSalvos[opiniaoId] = tipoVoto;
    localStorage.setItem(VOTOS_KEY, JSON.stringify(votosSalvos));
}

// --- 2. Função de Renderizar Feed (Não mudou) ---
function renderizarFeed(listaDeOpinioes) {
    const feedLista = document.getElementById('feed-lista');
    if (!feedLista) return;

    feedLista.innerHTML = '';
    const votosSalvos = getVotosSalvos();

    listaDeOpinioes.forEach(opiniao => {
        const card = document.createElement('article');
        card.className = 'opinion-card';
        card.dataset.id = opiniao.id;

        const votoUsuario = votosSalvos[opiniao.id];
        if (votoUsuario) {
            card.classList.add('voted-card');
        }

        const dataFormatada = new Date(opiniao.data_envio).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        card.innerHTML = `
            <h3 class="opinion-text">${opiniao.texto_opiniao}</h3>
            <div class="opinion-info">
                <span>Enviado por: <strong>${opiniao.autor}</strong></span>
                <span>${dataFormatada}</span>
            </div>

            <div class="vote-buttons">
                <button 
                    class="vote-button apoiar ${votoUsuario === 'apoiar' ? 'selected' : ''}" 
                    data-vote="apoiar" 
                    ${votoUsuario ? 'disabled' : ''}
                >Apoiar</button>

                <button 
                    class="vote-button neutro ${votoUsuario === 'neutro' ? 'selected' : ''}" 
                    data-vote="neutro"
                    ${votoUsuario ? 'disabled' : ''}
                >Neutro</button>

                <button 
                    class="vote-button contra ${votoUsuario === 'contra' ? 'selected' : ''}" 
                    data-vote="contra"
                    ${votoUsuario ? 'disabled' : ''}
                >Contra</button>
            </div>
            <div class="card-vote-count">
                <span data-count-type="apoiar"><strong>${opiniao.votos_apoiar}</strong> Apoiaram</span>
                <span data-count-type="neutro"><strong>${opiniao.votos_neutro}</strong> Neutros</span>
                <span data-count-type="contra"><strong>${opiniao.votos_contra}</strong> Contra</span>
            </div>
        `;
        // Adicionei 'data-count-type' aos <span> acima para
        // ficar mais fácil de encontrar e atualizar a contagem

        feedLista.appendChild(card);
    });
}

// --- 4. Função para Lidar com o Clique no Voto (ATUALIZADA) ---
// Agora ela é 'async' e chama o 'fetch'
const handleVoteClick = async (event) => {
    const target = event.target;
    if (!target.classList.contains('vote-button')) return;

    const tipoVoto = target.dataset.vote; // 'apoiar', 'neutro', 'contra'
    const card = target.closest('.opinion-card');
    const opiniaoId = card.dataset.id; // O ID (ex: 1, 2, 3)

    // Verifica se já votou (lógica do Local Storage, não mudou)
    const votosSalvos = getVotosSalvos();
    if (votosSalvos[opiniaoId]) {
        console.log('Você já votou nesta opinião.');
        return;
    }

    // NOVO: CONEXÃO COM O BACKEND
    try {
        const response = await fetch(`https://opinion-student-backend.onrender.com/opiniao/${opiniaoId}/voto`, {
            method: 'PUT', // O método que criamos
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tipo_voto: tipoVoto }) // Envia o tipo de voto
        });

        if (!response.ok) {
            throw new Error('Falha ao registrar voto. Servidor respondeu com erro.');
        }

        const resultado = await response.json();
        console.log('Voto registrado:', resultado.message);

        // SE O VOTO FOI UM SUCESSO NO BACKEND, FAZEMOS DUAS COISAS:
        
        // 1. Salva no Local Storage (para o usuário não votar de novo)
        salvarVoto(opiniaoId, tipoVoto);

        // 2. Atualiza a UI (Desabilita botões e atualiza a contagem)
        card.classList.add('voted-card');
        card.querySelectorAll('.vote-button').forEach(button => {
            button.disabled = true;
            if (button.dataset.vote === tipoVoto) {
                button.classList.add('selected');
            }
        });

        // NOVO: Atualiza a contagem de votos na tela
        const spanContagem = card.querySelector(`span[data-count-type="${tipoVoto}"] strong`);
        const contagemAtual = parseInt(spanContagem.textContent);
        spanContagem.textContent = contagemAtual + 1;

    } catch (error) {
        console.error('Erro ao enviar voto:', error);
        alert('Não foi possível registrar seu voto. Verifique sua conexão ou tente mais tarde.');
    }
}

// --- 5. Inicialização (ATUALIZADA e NÃO MUDOU desta vez) ---
document.addEventListener('DOMContentLoaded', async () => {
    
    try {
        const response = await fetch('https://opinion-student-backend.onrender.com/opinioes');
        
        if (!response.ok) {
            throw new Error('Falha ao carregar o feed. O servidor está ligado?');
        }
        
        const opinioesDoBackend = await response.json();
        renderizarFeed(opinioesDoBackend);

    } catch (error) {
        console.error('Erro ao buscar opiniões:', error);
    }

    // A lógica de escutar o clique no botão continua a mesma
    const feedLista = document.getElementById('feed-lista');
    if (feedLista) {
        feedLista.addEventListener('click', handleVoteClick);
    }
});