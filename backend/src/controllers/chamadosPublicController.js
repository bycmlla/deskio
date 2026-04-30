import {
  Chamado,
  Setor,
  UsuarioAdmin,
  HistoricoChamado,
} from "../models/index.js";
import { gerarProtocolo } from "../utils/protocolo.js";
import { Op } from "sequelize";

const PRIORIDADES_VALIDAS = ["Baixa", "Média", "Alta"];

function limparCPF(cpf) {
  return String(cpf || "").replace(/\D/g, "");
}

function validarCPF(cpf) {
  const cpfLimpo = limparCPF(cpf);

  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(cpfLimpo[i]) * (10 - i);
  }

  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;

  if (resto !== Number(cpfLimpo[9])) return false;

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(cpfLimpo[i]) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;

  return resto === Number(cpfLimpo[10]);
}

export async function criarChamado(req, res) {
  try {
    const {
      empresa_nome,
      empresa_documento,
      setor_id,
      solicitante_nome,
      solicitante_cpf,
      solicitante_whatsapp,
      titulo,
      descricao,
      prioridade,
    } = req.body;

    if (
      !empresa_nome ||
      !empresa_documento ||
      !setor_id ||
      !solicitante_nome ||
      !solicitante_cpf ||
      !solicitante_whatsapp ||
      !titulo ||
      !descricao ||
      !prioridade
    ) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    if (!validarCPF(solicitante_cpf)) {
      return res.status(400).json({ error: "CPF inválido" });
    }

    if (!PRIORIDADES_VALIDAS.includes(prioridade)) {
      return res.status(400).json({
        error: "Prioridade inválida. Use Baixa, Média ou Alta.",
      });
    }

    if (descricao.length < 10) {
      return res
        .status(400)
        .json({ error: "Descrição deve ter no mínimo 10 caracteres" });
    }

    const whatsappRegex = /^\+?[1-9]\d{7,14}$/;
    const wppClean = solicitante_whatsapp.replace(/[\s\-\(\)]/g, "");

    if (!whatsappRegex.test(wppClean)) {
      return res.status(400).json({ error: "WhatsApp inválido" });
    }

    const setor = await Setor.findOne({
      where: {
        id: setor_id,
        ativo: true,
      },
    });

    if (!setor) {
      return res.status(400).json({ error: "Setor inválido ou inativo" });
    }

    const cpfClean = limparCPF(solicitante_cpf);

    const protocolo = await gerarProtocolo();

    const chamado = await Chamado.create({
      protocolo,
      empresa_nome,
      empresa_documento,
      setor_id,
      solicitante_nome,
      solicitante_cpf: cpfClean,
      solicitante_whatsapp: wppClean,
      titulo,
      descricao,
      prioridade,
      status: "Aberto",
      data_abertura: new Date(),
      data_atualizacao: new Date(),
    });

    await HistoricoChamado.create({
      chamado_id: chamado.id,
      usuario_id: null,
      tipo_evento: "criacao",
      descricao: "Chamado criado pelo solicitante",
      prioridade,
      data_evento: new Date(),
    });

    return res.status(201).json({
      protocolo: chamado.protocolo,
      solicitante_nome: chamado.solicitante_nome,
      solicitante_cpf: chamado.solicitante_cpf,
      titulo: chamado.titulo,
      prioridade: chamado.prioridade,
      status: chamado.status,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

export async function buscarChamadoPorProtocolo(req, res) {
  try {
    const { protocolo } = req.params;
    const { cpf } = req.query;

    if (!cpf) {
      return res.status(400).json({
        error: "CPF é obrigatório para consultar este chamado.",
      });
    }

    if (!validarCPF(cpf)) {
      return res.status(400).json({
        error: "CPF inválido.",
      });
    }

    const cpfClean = limparCPF(cpf);

    const chamado = await Chamado.findOne({
      where: {
        protocolo,
        solicitante_cpf: cpfClean,
      },
      include: [
        { model: Setor, as: "setor", attributes: ["nome"] },
        { model: UsuarioAdmin, as: "tecnico", attributes: ["nome"] },
      ],
    });

    if (!chamado) {
      return res.status(404).json({
        error: "Chamado não encontrado para este CPF.",
      });
    }

    return res.json({
      protocolo: chamado.protocolo,
      status: chamado.status,
      prioridade: chamado.prioridade,
      titulo: chamado.titulo,
      solicitante_nome: chamado.solicitante_nome,
      setor: chamado.setor?.nome,
      data_abertura: chamado.data_abertura,
      tecnico: chamado.tecnico?.nome || null,
      descricao: chamado.descricao,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function listarChamadosPublicos(req, res) {
  try {
    const { cpf, status, prioridade, page = 1, limit = 20 } = req.query;

    if (!cpf) {
      return res.status(400).json({
        error: "CPF é obrigatório para consultar chamados.",
      });
    }

    if (!validarCPF(cpf)) {
      return res.status(400).json({
        error: "CPF inválido.",
      });
    }

    const cpfClean = limparCPF(cpf);

    const where = {
      solicitante_cpf: cpfClean,
    };

    if (status) {
      where.status = status;
    }

    if (prioridade) {
      if (!PRIORIDADES_VALIDAS.includes(prioridade)) {
        return res.status(400).json({
          error: "Prioridade inválida. Use Baixa, Média ou Alta.",
        });
      }

      where.prioridade = prioridade;
    }

    const chamados = await Chamado.findAndCountAll({
      where,
      attributes: [
        "protocolo",
        "titulo",
        "status",
        "prioridade",
        "data_abertura",
      ],
      order: [["data_abertura", "DESC"]],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
    });

    return res.json({
      total: chamados.count,
      pagina: Number(page),
      chamados: chamados.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}