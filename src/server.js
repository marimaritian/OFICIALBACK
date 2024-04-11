const express = require("express");
const client = require('./connection.js');
const todosRoutes = require("./todos.routes") ;
const response = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());
/* app.use(cors());*/
app.use(todosRoutes);
app.use(cors());

/* function teste(request, response) {
  return response.json("fasfasfas");
}
app.get("/fffff", teste); */

app.get("/health", (req, res) => {
  return res.json("up");
});



client.connect()
 
app.listen(3300, () => console.log("Server up in 3300"));


app.get('/users/:id', (req, res)=>{
    client.query(`Select * from users where id=${req.params.id}`, (err, result)=>{
        if(!err){
            res.send(result.rows);
        }
    });
    client.end;
})

//Rota para cadastrar o cliente
app.post('/novo-cliente', async (req, res) => {
    const { id_cliente, cpf, rg, nome_cliente, email } = req.body;

    const query = `
        INSERT INTO cliente (id_cliente, cpf, rg, nome_cliente, email)
        VALUES ($1, $2, $3, $4, $5);
    `;

    try {
        await client.query(query, [id_cliente, cpf, rg, nome_cliente, email]);
        res.status(201).send({ message: 'Cliente inserido com sucesso.' });
    } catch (err) {
        console.error('Erro ao inserir novo cliente:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/allclientes', (req, res) => {
    console.log('Requisição recebida para /produtos');
    const query = `
        SELECT * FROM cliente
    `;

    client.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        console.log('Consulta bem-sucedida:', result.rows);
        res.send(result.rows);
    });
    client.end;
    // Lembre-se de remover ou comentar qualquer chamada client.end(); aqui
});

//Rota dos clientes mais valiosos
app.get('/clientes-mais-valiosos', (req, res) => {
    console.log('Requisição recebida para /clientes-mais-valiosos');

    const query = `
        SELECT nome_cliente, SUM(p.preco * ip.quantidade) AS valor_gasto
        FROM cliente AS c
        INNER JOIN pedidos AS pe ON pe.id_cliente = c.id_cliente
        INNER JOIN item_pedido AS ip ON ip.id_pedido = pe.id_pedido
        INNER JOIN produtos AS p ON p.id_produto = ip.id_produto
        GROUP BY nome_cliente
        ORDER BY valor_gasto DESC
        LIMIT 20;
    `;

    client.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
        console.log('Consulta bem-sucedida:', result.rows);
        res.send(result.rows);
    });
});
//Rotas de produtos
//Rota para pegar os produtos ordenados
app.get('/produtos', (req, res) => {
    console.log('Requisição recebida para /produtos');
    const query = `
        SELECT nome_produto, (preco / unidades_por_compra) AS preco_por_unidade
        FROM produtos
        ORDER BY preco_por_unidade DESC
    `;

    client.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        console.log('Consulta bem-sucedida:', result.rows);
        res.send(result.rows);
    });
    client.end;
    // Lembre-se de remover ou comentar qualquer chamada client.end(); aqui
});

app.get('/valor-vendido-produtos', (req, res) => {
    console.log('Requisição recebida para /valor-vendido-produtos');
    const query = `
        SELECT p.nome_produto, SUM(ip.quantidade * p.preco) AS valor_vendido
        FROM produtos AS p
        INNER JOIN item_pedido AS ip ON ip.id_produto = p.id_produto
        GROUP BY p.nome_produto
        ORDER BY valor_vendido DESC;
    `;

    client.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        console.log('Consulta bem-sucedida:', result.rows);
        res.send(result.rows);
    });
    // Remova ou comente client.end se você precisa manter a conexão aberta para outras requisições.
});

app.get('/allprodutos', (req, res) => {
    console.log('Requisição recebida para /produtos');
    const query = `
        SELECT * FROM produtos
    `;

    client.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        console.log('Consulta bem-sucedida:', result.rows);
        res.send(result.rows);
    });
    client.end;
    // Lembre-se de remover ou comentar qualquer chamada client.end(); aqui
});

app.post('/createprodutos', (req, res)=> {
    const produto= req.body;
    let insertQuery = `insert into produtos(id_produto, nome_produto, preco, unidades_por_compra) 
                       values(${produto.id_produto}, '${produto.nome_produto}', '${produto.preco}', '${produto.unidades_por_compra}')`

    client.query(insertQuery, (err, result)=>{
        if(!err){
            res.send('Insertion was successful')
        }
        else{ console.log(err.message) }
    })
    client.end;
})

app.put('/produtos/:id', (req, res) => {
    let produto = req.body;
    let updateQuery = `update produtos set nome_produto = $1, preco = $2, unidades_por_compra = $3 where id_produto = $4`;

    // Usando parâmetros parametrizados para evitar SQL Injection
    client.query(updateQuery, [produto.nome_produto, produto.preco, produto.unidades_por_compra, req.params.id], (err, result) => {
        if (!err) {
            res.send('Update was successful');
        } else {
            console.log(err.message);
            res.status(500).send(err.message);
        }
    });
    // Removido client.end;
});

app.delete('/produtos/:id', (req, res) => {
    // Usando parâmetros parametrizados para prevenir injeção SQL
    let deleteQuery = 'delete from produtos where id_produto = $1';

    client.query(deleteQuery, [req.params.id], (err, result) => {
        if (!err) {
            res.send('Deletion was successful');
        } else {
            console.log(err.message);
            res.status(500).send(err.message);
        }
    });
    // Removido client.end; para não fechar a conexão após a consulta
});


//Rota pedidos-pix
app.get('/pedidos-pix', (req, res) => {
    console.log('Requisição recebida para /pedidos-pix');

    const query = `
        SELECT nome_cliente, p.nome_produto, pedidos.data_pedido 
        FROM cliente c
        JOIN pedidos ON c.id_cliente = pedidos.id_cliente
        JOIN item_pedido ip ON pedidos.id_pedido = ip.id_pedido
        JOIN produtos p ON ip.id_produto = p.id_produto
        WHERE pedidos.modo_pagamento = 'pix'
        ORDER BY pedidos.data_pedido;
    `;

    client.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        console.log('Consulta bem-sucedida:', result.rows);
        res.send(result.rows);
    });
});

app.get('/allpedidos', (req, res) => {
    console.log('Requisição recebida para /produtos');
    const query = `
        SELECT * FROM pedidos
    `;

    client.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        console.log('Consulta bem-sucedida:', result.rows);
        res.send(result.rows);
    });
    client.end;
    // Lembre-se de remover ou comentar qualquer chamada client.end(); aqui
});

app.get('/allitems', (req, res) => {
    console.log('Requisição recebida para /produtos');
    const query = `
        SELECT * FROM item_pedido
    `;

    client.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        console.log('Consulta bem-sucedida:', result.rows);
        res.send(result.rows);
    });
    client.end;
    // Lembre-se de remover ou comentar qualquer chamada client.end(); aqui
});


//Produtos estoque mínimo
app.get('/produtos-estoque-minimo', (req, res) => {
    console.log('Requisição recebida para /produtos-estoque-minimo');

    const query = `
        SELECT nome_produto, MIN(e.unidades_disponiveis) AS unidades_minimas
        FROM produtos AS p
        INNER JOIN estoque AS e ON e.id_produto = p.id_produto
        GROUP BY nome_produto;
    `;

    client.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
        console.log('Consulta bem-sucedida:', result.rows);
        res.send(result.rows);
    });
});

app.get('/allestoque', (req, res) => {
    console.log('Requisição recebida para /produtos');
    const query = `
        SELECT * FROM estoque
    `;

    client.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        console.log('Consulta bem-sucedida:', result.rows);
        res.send(result.rows);
    });
    client.end;
    // Lembre-se de remover ou comentar qualquer chamada client.end(); aqui
});

//Pacotes de venda
app.get('/pacotes-venda', async (req, res) => {
    const query = `
      SELECT nome_produto, (SUM(e.unidades_disponiveis)/SUM(p.unidades_por_compra)) AS pacotes_de_venda
      FROM produtos AS p
      INNER JOIN estoque AS e ON e.id_produto = p.id_produto
      GROUP BY nome_produto;
    `;
  
    try {
      const result = await client.query(query);
      res.json(result.rows);
    } catch (err) {
      console.error('Erro ao consultar o banco de dados:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
  });






app.post('/users', (req, res)=> {
    const user = req.body;
    let insertQuery = `insert into users(id, firstname, lastname, location) 
                       values(${user.id}, '${user.firstname}', '${user.lastname}', '${user.location}')`

    client.query(insertQuery, (err, result)=>{
        if(!err){
            res.send('Insertion was successful')
        }
        else{ console.log(err.message) }
    })
    client.end;
})

app.put('/users/:id', (req, res)=> {
    let user = req.body;
    let updateQuery = `update users
                       set firstname = '${user.firstname}',
                       lastname = '${user.lastname}',
                       location = '${user.location}'
                       where id = ${user.id}`

    client.query(updateQuery, (err, result)=>{
        if(!err){
            res.send('Update was successful')
        }
        else{ console.log(err.message) }
    })
    client.end;
})

app.delete('/users/:id', (req, res)=> {
    let insertQuery = `delete from users where id=${req.params.id}`

    client.query(insertQuery, (err, result)=>{
        if(!err){
            res.send('Deletion was successful')
        }
        else{ console.log(err.message) }
    })
    client.end;
}) 