// Espera o documento HTML ser completamente carregado
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Seleção dos Elementos da UI (ATUALIZADO) ---
    const form = document.getElementById('feedback-form');
    const textarea = document.getElementById('opiniao-textarea');
    const charCounter = document.getElementById('char-counter');
    const errorMessage = document.getElementById('error-message');
    const checkbox = document.getElementById('anonimo-checkbox');
    
    // NOVO: Seleciona os elementos do campo de nome
    const autorInputWrapper = document.getElementById('autor-input-wrapper');
    const autorInput = document.getElementById('autor-input');
    
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

    // --- NOVO: LÓGICA PARA MOSTRAR/ESCONDER O CAMPO DE NOME ---
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            // Se "Anônimo" estiver MARCADO, esconde o campo
            autorInputWrapper.classList.remove('show');
        } else {
            // Se "Anônimo" estiver DESMARCADO, mostra o campo
            autorInputWrapper.classList.add('show');
        }
    });

    // --- 3. Regra: Validação no Envio (ATUALIZADO) ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const opiniao = textarea.value.trim();

        if (opiniao.length === 0) {
            errorMessage.textContent = 'Por favor, escreva sua opinião antes de enviar.';
            errorMessage.classList.add('show');
            textarea.classList.add('error-border');
            return; 
        }

        errorMessage.classList.remove('show');
        textarea.classList.remove('error-border');

        // ATUALIZADO: Lógica do Autor
        const isAnonimo = checkbox.checked;

        const autorValor = isAnonimo ? 'Anônimo' : autorInput.value;

        const dados = {
            texto_opiniao: opiniao,
            autor: autorValor
        };

        try {
            // CONEXÃO COM O BACKEND (Não mudou)
            const response = await fetch('https://opinion-student-backend.onrender.com/opiniao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            });

            if (!response.ok) {
                throw new Error('Falha ao enviar opinião. Tente novamente.');
            }

            const resultado = await response.json();
            console.log('Opinião enviada:', resultado);

            alert('Obrigado! Sua opinião foi enviada.');
            window.location.href = 'feed.html';

        } catch (error) {
            console.error('Erro no fetch:', error);
            errorMessage.textContent = error.message;
            errorMessage.classList.add('show');
        }
    });
});