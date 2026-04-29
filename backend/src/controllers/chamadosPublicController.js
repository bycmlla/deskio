import {
  Chamado,
  Setor,
  UsuarioAdmin,
  HistoricoChamado,
} from "../models/index.js";
import { gerarProtocolo } from "../utils/protocolo.js";
import { Op } from "sequelize";

export async function criarChamado(req, res) {
  try {
    const {
      empresa_nome,
      empresa_documento,
      setor_id,
      solicitante_nome,
      solicitante_whatsapp,
      titulo,
      descricao,
    } = req.body;

    if (
      !empresa_nome ||
      !empresa_documento ||
      !setor_id ||
      !solicitante_nome ||
      !solicitante_whatsapp ||
      !titulo ||
      !descricao
    ) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
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
    const setor = await Setor.findOne({ where: { id: setor_id, ativo: true } });
    if (!setor) {
      return res.status(400).json({ error: "Setor inválido ou inativo" });
    }

    const protocolo = await gerarProtocolo();
    const chamado = await Chamado.create({
      protocolo,
      empresa_nome,
      empresa_documento,
      setor_id,
      solicitante_nome,
      solicitante_whatsapp: wppClean,
      titulo,
      descricao,
      status: "Aberto",
      data_abertura: new Date(),
      data_atualizacao: new Date(),
    });

    await HistoricoChamado.create({
      chamado_id: chamado.id,
      usuario_id: null,
      tipo_evento: "criacao",
      descricao: "Chamado criado pelo solicitante",
      data_evento: new Date(),
    });

    return res.status(201).json({
      protocolo: chamado.protocolo,
      solicitante_nome: chamado.solicitante_nome,
      titulo: chamado.titulo,
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
    const chamado = await Chamado.findOne({
      where: { protocolo },
      include: [
        { model: Setor, as: "setor", attributes: ["nome"] },
        { model: UsuarioAdmin, as: "tecnico", attributes: ["nome"] },
      ],
    });
    if (!chamado)
      return res.status(404).json({ error: "Chamado não encontrado" });

    return res.json({
      protocolo: chamado.protocolo,
      status: chamado.status,
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
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const chamados = await Chamado.findAndCountAll({
      where,
      attributes: ["protocolo", "titulo", "status", "data_abertura"],
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
