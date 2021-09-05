const dados = require('../bancodedados');
const { format } = require('date-fns');
let proximaConta = 1;
let registro = {};
let valor;
let numeroConta;
let contaPesquisada = {};
let senha;
let numeroContaDestino;
let numeroContaOrigem;

function registrar(localRegistro) {
    if (localRegistro == dados.saques || localRegistro == dados.depositos) {
        registro = {
            data: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            numero_conta: numeroConta,
            valor: valor
        };
    } else {
        registro = {
            data: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            numero_conta_origem: numeroContaOrigem,
            numero_conta_destino: numeroContaDestino,
            valor: valor
        }
    }
    localRegistro.push(registro);
};


function validaCpf(cpf) {
    const cpfExiste = dados.contas.find(x => x.usuario.cpf == cpf);

    if (cpfExiste) {
        return "O CPF informado já existe na base de dados.";
    }
};

function validaEmail(email) {
    const emailExiste = dados.contas.find(x => x.usuario.email == email);

    if (emailExiste) {
        return "O email informado já existe na base de dados.";
    }
};



function criarConta(req, res) {

    const erroCpfExistente = validaCpf(req.body.cpf);
    if (erroCpfExistente) {
        res.status(400).json({ mensagem: `${erroCpfExistente}` });
        return;
    };

    const erroEmailExistente = validaEmail(req.body.email);
    if (erroEmailExistente) {
        res.status(400).json({ mensagem: `${erroEmailExistente}` });
        return;
    };

    if (!req.body.nome || !req.body.cpf || !req.body.data_nascimento || !req.body.telefone || !req.body.email || !req.body.senha) {
        res.status(400).json({ mensagem: 'Estão faltando dados para a criação da conta' });
        return;
    }


    const novaConta = {
        numero: proximaConta.toString(),
        saldo: 0,
        usuario: {
            nome: req.body.nome,
            cpf: req.body.cpf,
            data_nascimento: req.body.data_nascimento,
            telefone: req.body.telefone,
            email: req.body.email,
            senha: req.body.senha
        }
    }
    proximaConta += 1
    dados.contas.push(novaConta);
    res.status(201).json(novaConta);

};



function listarContas(req, res) {

    if (req.query.senha_banco == '123') {
        res.status(200);
        res.json(dados.contas);

    } else if (!req.query.senha_banco) {
        res.status(400).json({ mensagem: 'A senha deve ser informada.' })

    } else {
        res.status(400).json({ mensagem: 'A senha está incorreta.' })
    }

};


function atualizarUsuarioConta(req, res) {

    contaPesquisada = dados.contas.find(x => x.numero == req.params.numeroConta);

    if (!contaPesquisada) {
        res.status(400).json({ mensagem: "A conta informada não consta no banco de dados." })
        return
    };

    if (!req.body.nome && !req.body.cpf && !req.body.data_nascimento && !req.body.telefone && !req.body.email && !req.body.senha) {
        res.status(400).json({ mensagem: "Pelo menos um dado deve ser informado para atualização do usuário." })
        return
    }

    const erroCpfExistente = validaCpf(req.body.cpf);
    if (erroCpfExistente) {
        res.status(400).json({ mensagem: `${erroCpfExistente}` });
        return;
    };

    const erroEmailExistente = validaEmail(req.body.email);
    if (erroEmailExistente) {
        res.status(400).json({ mensagem: `${erroEmailExistente}` });
        return;
    };


    contaPesquisada.usuario.nome = req.body.nome ? req.body.nome : contaPesquisada.usuario.nome;

    contaPesquisada.usuario.cpf = req.body.cpf ? req.body.cpf : contaPesquisada.usuario.cpf;

    contaPesquisada.usuario.data_nascimento = req.body.data_nascimento ? req.body.data_nascimento : contaPesquisada.usuario.data_nascimento;

    contaPesquisada.usuario.telefone = req.body.telefone ? req.body.telefone : contaPesquisada.usuario.telefone;

    contaPesquisada.usuario.email = req.body.email ? req.body.email : contaPesquisada.usuario.email;

    contaPesquisada.usuario.senha = req.body.senha ? req.body.senha : contaPesquisada.usuario.senha;
    res.status(200).json({ mensagem: "Conta atualizada com sucesso!" });
};


function excluirConta(req, res) {
    contaPesquisada = dados.contas.find(x => x.numero == Number(req.params.numeroConta));

    if (!contaPesquisada) {
        res.status(400).json({ mensagem: "A conta informada não consta no banco de dados." })
        return
    };

    if (contaPesquisada.saldo > 0) {
        res.status(400).json({ mensagem: "A conta não pode ser excluída pois o saldo é maior que zero." })
        return;
    }

    const indiceExcluir = dados.contas.indexOf(contaPesquisada);
    dados.contas.splice(indiceExcluir, 1);
    res.status(200).json({ mensagem: "Conta excluída com sucesso!" });
};


function depositar(req, res) {
    numeroConta = req.body.numero_conta.toString();
    valor = req.body.valor;
    contaPesquisada = dados.contas.find(x => x.numero == req.body.numero_conta);

    if (!numeroConta || !valor) {
        res.status(400).json({ mensagem: 'Dados insuficientes para realizar a transação.' });
        return;
    }

    if (!contaPesquisada) {
        res.status(404).json({ mensagem: 'Conta não encontrada.' });
        return;
    }

    if (valor <= 0) {
        res.status(400).json({ mensagem: 'Valor de depósito inválido.' });
        return;
    }

    contaPesquisada.saldo += valor;
    registrar(dados.depositos);
    res.status(200).json({ mensagem: 'Depósito realizado com sucesso!' });
};


function sacar(req, res) {
    numeroConta = req.body.numero_conta.toString();
    valor = req.body.valor;
    senha = req.body.senha;
    contaPesquisada = dados.contas.find(x => x.numero == req.body.conta);

    if (!numeroConta || !valor || !senha) {
        res.status(400).json({ mensagem: 'Dados insuficientes para realizar a transação.' });
        return;
    }

    if (!contaPesquisada) {
        res.status(404).json({ mensagem: 'Conta não encontrada.' });
        return;
    }

    if (senha != contaPesquisada.usuario.senha) {
        res.status(400).json({ mensagem: 'Senha inválida.' });
        return;
    }

    if (valor <= 0) {
        res.status(400).json({ mensagem: 'Valor de saque inválido.' });
        return;
    }

    if (valor > contaPesquisada.saldo) {
        res.status(400).json({ mensagem: 'Saldo insuficiente.' });
        return;
    }

    contaPesquisada.saldo -= valor;
    registrar(dados.saques);
    res.status(200).json({ mensagem: 'Saque realizado com sucesso!' })
};


function transferir(req, res) {
    valor = req.body.valor;
    senha = req.body.senha;
    numeroContaDestino = req.body.numero_conta_destino;
    numeroContaOrigem = req.body.numero_conta_origem;
    const contaOrigemPesquisada = dados.contas.find(x => x.numero == numeroContaOrigem);
    const contaDestinoPesquisada = dados.contas.find(x => x.numero == numeroContaDestino);

    if (!numeroContaOrigem || !numeroContaDestino || !valor || !senha) {
        res.status(400).json({ mensagem: 'Dados insuficientes para realizar a transação.' });
        return;
    }

    if (!contaOrigemPesquisada) {
        res.status(404).json({ mensagem: 'Conta de origem não encontrada.' });
        return;
    }

    if (!contaDestinoPesquisada) {
        res.status(404).json({ mensagem: 'Conta de destino não encontrada.' });
        return;
    }

    if (senha != contaOrigemPesquisada.usuario.senha) {
        res.status(400).json({ mensagem: 'Senha inválida.' });
        return;
    }

    if (valor <= 0) {
        res.status(400).json({ mensagem: 'Valor de transferência inválido.' });
        return;
    }

    if (valor > contaOrigemPesquisada.saldo) {
        res.status(400).json({ mensagem: 'Saldo insuficiente.' });
        return;
    }

    contaOrigemPesquisada.saldo -= valor;
    contaDestinoPesquisada.saldo += valor;
    registrar(dados.transferencias);
    res.status(200).json({ mensagem: 'Transferência realizada com sucesso!' })
};

function saldo(req, res) {
    contaPesquisada = dados.contas.find(x => x.numero == req.query.numero_conta);

    if (!req.query.numero_conta || !req.query.senha) {
        res.status(400).json({ mensagem: 'Dados insuficientes para realizar a transação.' });
        return;
    }

    if (!contaPesquisada) {
        res.status(404).json({ mensagem: 'Conta não encontrada.' });
        return;
    }

    if (req.query.senha != contaPesquisada.usuario.senha) {
        res.status(400).json({ mensagem: 'Senha inválida.' });
        return;
    }

    res.status(200).json({ saldo: contaPesquisada.saldo });
};


function extrato(req, res) {
    contaPesquisada = dados.contas.find(x => x.numero == req.query.numero_conta);

    if (!req.query.numero_conta || !req.query.senha) {
        res.status(400).json({ mensagem: 'Dados insuficientes para realizar a transação.' });
        return;
    }

    if (!contaPesquisada) {
        res.status(400).json({ mensagem: 'Conta não encontrada.' });
        return;
    }

    if (req.query.senha != contaPesquisada.usuario.senha) {
        res.status(400).json({ mensagem: 'Senha inválida.' });
        return;
    }

    const depositos = dados.depositos.filter(x => x.numero_conta == req.query.numero_conta);
    const saques = dados.saques.filter(x => x.numero_conta == req.query.numero_conta);
    const transferenciasRecebidas = dados.transferencias.filter(x => x.numero_conta_destino == req.query.numero_conta);
    const transferenciasEnviadas = dados.transferencias.filter(x => x.numero_conta_origem == req.query.numero_conta);

    res.status(200).json({
        depositos: depositos,
        saques: saques,
        transferenciasEnviadas: transferenciasEnviadas,
        transferenciasRecebidas: transferenciasRecebidas
    });
};


module.exports = {
    listarContas,
    criarConta,
    atualizarUsuarioConta,
    excluirConta,
    depositar,
    sacar,
    transferir,
    saldo,
    extrato
};