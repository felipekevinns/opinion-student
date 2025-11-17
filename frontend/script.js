document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Seleção dos Elementos da UI (Não mudou) ---
    const form = document.getElementById('feedback-form');
    const textarea = document.getElementById('opiniao-textarea');
    const charCounter = document.getElementById('char-counter');
    const errorMessage = document.getElementById('error-message');
    const checkbox = document.getElementById('anonimo-checkbox');
    
    const MAX_CHARS = 1000;

    // --- 2. Regra: Contador de Caracteres (Não mudou) ---
    textarea.addEventListener('input', () => {
        const charCount = textarea.value.length;
        charCounter.textContent = `${charCount} / ${MAX_CHARS}`;
        if (charCount >= MAX_CHARS) {
            charCounter.style.color = 'var(--danger)';
        } else {
            charCounter.style.color = 'var(--text-secondary)';
        }
    });

    // --- 3. Regra: Validação no Envio (ATUALIZADO) ---
    // Tornamos a função 'async' para podermos usar 'await'
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const opiniao = textarea.value.trim();

        // Validação de campo vazio (Não mudou)
        if (opiniao.length === 0) {
            errorMessage.textContent = 'Por favor, escreva sua opinião antes de enviar.';
            errorMessage.classList.add('show');
            textarea.classList.add('error-border');
            return; 
        }

        // Limpa qualquer erro anterior
        errorMessage.classList.remove('show');
        textarea.classList.remove('error-border');

        // Pega o status do anonimato
        const isAnonimo = checkbox.checked;
        
        // NOVO: Prepara os dados para enviar ao backend
        const dados = {
            texto_opiniao: opiniao,
            // Se for anônimo, enviamos 'null' ou 'Anônimo', 
            // nosso backend já trata isso
            autor: isAnonimo ? 'Anônimo' : null 
        };

        // (Se não for anônimo, você precisaria de um campo <input> para o nome,
        // mas vamos manter simples por enquanto e deixar o backend cuidar)

        try {
            // NOVO: CONEXÃO COM O BACKEND (A Mágica)
            // Usamos 'fetch' para chamar nossa rota POST
            const response = await fetch('http://localhost:3000/opiniao', {
                method: 'POST', // O método que criamos
                headers: {
                    'Content-Type': 'application/json' // Avisa que estamos enviando JSON
                },
                body: JSON.stringify(dados) // Converte nosso objeto 'dados' em texto JSON
            });

            // Se o backend responder com um erro (ex: 500)
            if (!response.ok) {
                throw new Error('Falha ao enviar opinião. Tente novamente.');
            }

            // Se deu tudo certo (resposta 201 Created)
            const resultado = await response.json();
            console.log('Opinião enviada:', resultado);

            // Regra 3 (Saída: Sucesso)
            alert('Obrigado! Sua opinião foi enviada.');

            // Redireciona para o Feed
            window.location.href = 'feed.html';

        } catch (error) {
            // Se o servidor estiver desligado ou der erro
            console.error('Erro no fetch:', error);
            errorMessage.textContent = error.message;
            errorMessage.classList.add('show');
        }
    });
});