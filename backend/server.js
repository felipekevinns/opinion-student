const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'password';

const app = express();
const PORT = 3000;


app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());


const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
}).promise();

app.get('/', (req, res) => {
    res.send('Servidor Node.js funcionando!');
});


app.post('/opiniao', async (req, res) => {

    try {
        const { texto_opiniao, autor } = req.body;

        const sql = `
            INSERT INTO opinioes (texto_opiniao, autor)
            VALUES (?, ?)
        `;

        const values = [
            texto_opiniao,
            autor || 'Anônimo'
        ];

        const [result] = await pool.query(sql, values);

        console.log('Nova opinião inserida com sucesso! ID:', result.insertId);
        res.status(201).send({
            message: 'Opinião enviada com sucesso!',
            id_da_opiniao: result.insertId
        });

    } catch (error) {
        console.error('Erro ao inserir opinião:', error);
        res.status(500).send({
            message: 'Erro no servidor ao tentar salvar a opinião.',
            error: error.message
        });
    }
});


app.get('/opinioes', async (req, res) => {
    
    try {
        const sql = "SELECT * FROM opinioes ORDER BY data_envio DESC";

        const [resultados] = await pool.query(sql);

        res.status(200).send(resultados);

    } catch (error) {
        console.error('Erro ao buscar opiniões:', error);
        res.status(500).send({
            message: 'Erro no servidor ao buscar opiniões.',
            error: error.message
        });
    }
});


app.put('/opiniao/:id/voto', async (req, res) => {
    
    try {
        const { id } = req.params; 

        const { tipo_voto } = req.body;
        
        let colunaParaIncrementar;

        if (tipo_voto === 'apoiar') {
            colunaParaIncrementar = 'votos_apoiar';
        } else if (tipo_voto === 'contra') {
            colunaParaIncrementar = 'votos_contra';
        } else if (tipo_voto === 'neutro') {
            colunaParaIncrementar = 'votos_neutro';
        } else {
            return res.status(400).send({ message: 'Tipo de voto inválido.' });
        }

        const sql = `
            UPDATE opinioes 
            SET ?? = ?? + 1 
            WHERE id = ?
        `;

        const values = [colunaParaIncrementar, colunaParaIncrementar, id];

        const [result] = await pool.query(sql, values);

        if (result.affectedRows === 0) {

            return res.status(404).send({ message: 'Opinião não encontrada.' });
        }

        res.status(200).send({ message: `Voto '${tipo_voto}' registrado com sucesso!` });

    } catch (error) {
        console.error('Erro ao registrar voto:', error);
        res.status(500).send({
            message: 'Erro no servidor ao registrar voto.',
            error: error.message
        });
    }
});



app.post('/admin/register', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).send({ message: 'Email e senha são obrigatórios.' });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);


        const sql = "INSERT INTO admins (email, senha_hash) VALUES (?, ?)";
        const values = [email, senhaHash];
        
        const [result] = await pool.query(sql, values);

        res.status(201).send({ 
            message: 'Administrador registrado com sucesso!',
            admin_id: result.insertId 
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: 'Este email já está registrado.' });
        }
        
        console.error('Erro ao registrar admin:', error);
        res.status(500).send({ message: 'Erro no servidor.' });
    }
});



app.post('/admin/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).send({ message: 'Email e senha são obrigatórios.' });
        }

        // 2. Procura o admin pelo email no banco
        const sql = "SELECT * FROM admins WHERE email = ?";
        const [rows] = await pool.query(sql, [email]);

        if (rows.length === 0) {
            return res.status(401).send({ message: 'Email ou senha inválidos.' });
        }
        
        const admin = rows[0];

        const senhaCorreta = await bcrypt.compare(senha, admin.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).send({ message: 'Email ou senha inválidos.' });
        }

        const payload = {
            id: admin.id,
            email: admin.email
        };
        
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: '8h'
        });

        res.status(200).send({
            message: 'Login bem-sucedido!',
            token: token
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).send({ message: 'Erro no servidor.' });
    }
});



const verificarToken = (req, res, next) => {
    try {
        // 1. Pega o token do cabeçalho 'Authorization'
        // O frontend vai enviar o token assim: "Bearer [token_longo_aqui]"
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Pega só a parte do token

        // 2. Se não veio o token, bloqueia
        if (token == null) {
            return res.status(401).send({ message: 'Acesso negado. Token não fornecido.' });
        }

        // 3. Verifica se o token é válido
        // Ele usa a MESMA chave secreta que usamos para criar o token
        jwt.verify(token, JWT_SECRET, (err, admin) => {
            if (err) {
                return res.status(403).send({ message: 'Token inválido ou expirado.' });
            }
            
            // 4. Se o token for válido, salva os dados do admin no pedido
            // e deixa o pedido continuar para a rota principal
            req.admin = admin;
            next(); // <-- Comando para "Pode passar!"
        });
    } catch (error) {
        res.status(500).send({ message: 'Erro interno no servidor.' });
    }
};


// NOVO: ROTA PROTEGIDA DO DASHBOARD
// Note que passamos o 'verificarToken' como segundo argumento.
// Isso força o "Segurança" a rodar antes de executar a rota.
app.get('/admin/dashboard', verificarToken, async (req, res) => {
    try {
        // Se chegou aqui, o token é válido e o 'req.admin' existe
        
        // 1. Busca os dados do banco (a lógica do seu dashboard.js)
        const sql = `
            SELECT 
                *, 
                (votos_apoiar - votos_contra) AS pontos
            FROM 
                opinioes
            ORDER BY 
                pontos DESC
        `;
        
        const [opinioes] = await pool.query(sql);

        // 2. Envia o ranking completo para o admin
        res.status(200).send(opinioes);

    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        res.status(500).send({ message: 'Erro no servidor ao buscar dados.' });
    }
});


app.delete('/admin/opiniao/:id', verificarToken, async (req, res) => {
    const { id } = req.params; // Pega o ID da opinião da URL

    try {
        // Primeiro, verifica se a opinião existe
        const [opiniaoExistente] = await pool.query('SELECT * FROM opinioes WHERE id = ?', [id]);
        if (opiniaoExistente.length === 0) {
            return res.status(404).json({ message: 'Opinião não encontrada.' });
        }

        // Se existe, procede com a exclusão
        await pool.query('DELETE FROM opinioes WHERE id = ?', [id]);
        res.status(204).send(); // 204 No Content: Sucesso, mas não há conteúdo para retornar
    } catch (error) {
        console.error('Erro ao deletar opinião:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao deletar opinião.' });
    }
});


app.listen(PORT, () => {
    console.log(`Backend rodando na porta ${PORT}`);
    console.log('Servidor pronto para receber pedidos.');
});