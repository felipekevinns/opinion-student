document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const errorMessage = document.getElementById('login-error-message');

    // Tornamos a função 'async' para usar 'await'
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o recarregamento da página
        errorMessage.classList.remove('show'); // Limpa erros antigos

        const email = emailInput.value;
        const password = passwordInput.value;

        // NOVO: Prepara os dados para enviar ao backend
        const dados = {
            email: email,
            senha: password
        };

        try {
            // NOVO: Chama a rota de login do backend
            const response = await fetch('https://opinion-student-backend.onrender.com/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados) // Envia o email e a senha
            });

            const resultado = await response.json();

            // Se a resposta NÃO for OK (ex: 401, 500)
            if (!response.ok) {
                // O 'resultado.message' virá do nosso server.js
                // (ex: "Email ou senha inválidos.")
                throw new Error(resultado.message || 'Erro ao tentar fazer login.');
            }

            // --- SUCESSO! (Resposta 200 OK) ---

            // 1. Salva o TOKEN REAL (o código JWT) que veio do backend
            // Substitui o antigo "true" que era falso
            localStorage.setItem('admin_token', resultado.token); 

            // 2. Redireciona para o dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            // Se der erro no fetch ou se o response.ok for false
            console.error('Erro no login:', error);
            errorMessage.textContent = error.message;
            errorMessage.classList.add('show');
        }
    });
});