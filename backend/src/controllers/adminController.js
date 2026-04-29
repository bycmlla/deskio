import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op, QueryTypes } from "sequelize";
import sequelize from "../database.js";
import {
  Chamado,
  Setor,
  UsuarioAdmin,
  HistoricoChamado,
  ObservacaoInterna,
} from "../models/index.js";

export async function login(req, res) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ error: "Email e senha são obrigatórios" });

    const usuario = await UsuarioAdmin.findOne({
      where: { email, ativo: true },
    });
    if (!usuario)
      return res.status(401).json({ error: "Credenciais inválidas" });

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida)
      return res.status(401).json({ error: "Credenciais inválidas" });

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function dashboard(req, res) {
  try {
    const total = await Chamado.count();

    const abertos = await Chamado.count({
      where: { status: "Aberto" },
    });

    const emAndamento = await Chamado.count({
      where: { status: "Em andamento" },
    });

    const fechados = await Chamado.count({
      where: { status: "Fechado" },
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const abertosHoje = await Chamado.count({
      where: {
        data_abertura: {
          [Op.gte]: hoje,
        },
      },
    });

    const chamadosPorSetor = await sequelize.query(
      `
      SELECT
        s.id AS setor_id,
        s.nome AS setor,
        COUNT(c.id) AS total,
        SUM(CASE WHEN c.status = 'Fechado' THEN 1 ELSE 0 END) AS fechados,
        ROUND(
          CASE
            WHEN COUNT(c.id) = 0 THEN 0
            ELSE (SUM(CASE WHEN c.status = 'Fechado' THEN 1 ELSE 0 END) / COUNT(c.id)) * 100
          END,
          2
        ) AS porcentagemFechados
      FROM setor s
      LEFT JOIN chamado c ON c.setor_id = s.id
      GROUP BY s.id, s.nome
      ORDER BY total DESC, s.nome ASC
      `,
      { type: QueryTypes.SELECT }
    );

    const chamadosPorDia = await sequelize.query(
      `
      SELECT
        DATE(data_abertura) AS data,
        COUNT(id) AS total
      FROM chamado
      WHERE data_abertura >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
      GROUP BY DATE(data_abertura)
      ORDER BY data ASC
      `,
      { type: QueryTypes.SELECT }
    );

    const mediaResult = await sequelize.query(
      `
      SELECT
        ROUND(COUNT(id) / GREATEST(DATEDIFF(CURDATE(), MIN(DATE(data_abertura))) + 1, 1), 2) AS media
      FROM chamado
      `,
      { type: QueryTypes.SELECT }
    );

    const tempoMedioResult = await sequelize.query(
      `
      SELECT
        ROUND(AVG(TIMESTAMPDIFF(HOUR, data_abertura, data_fechamento)), 2) AS horas
      FROM chamado
      WHERE status = 'Fechado'
        AND data_fechamento IS NOT NULL
      `,
      { type: QueryTypes.SELECT }
    );

    const taxaFechamento = total > 0 ? Number(((fechados / total) * 100).toFixed(2)) : 0;

    return res.json({
      total,
      abertos,
      emAndamento,
      fechados,
      abertosHoje,
      taxaFechamento,
      mediaChamadosPorDia: Number(mediaResult[0]?.media || 0),
      tempoMedioFechamentoHoras: Number(tempoMedioResult[0]?.horas || 0),
      chamadosPorSetor: chamadosPorSetor.map((item) => ({
        setor_id: item.setor_id,
        setor: item.setor,
        total: Number(item.total || 0),
        fechados: Number(item.fechados || 0),
        porcentagemFechados: Number(item.porcentagemFechados || 0),
      })),
      chamadosPorDia: chamadosPorDia.map((item) => ({
        data: item.data,
        total: Number(item.total || 0),
      })),
      statusDistribuicao: [
        { name: "Abertos", value: abertos },
        { name: "Em andamento", value: emAndamento },
        { name: "Fechados", value: fechados },
      ],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function listarChamados(req, res) {
  try {
    const {
      protocolo,
      solicitante,
      status,
      tecnico_id,
      setor_id,
      sem_tecnico,
      data_inicio,
      data_fim,
      page = 1,
      limit = 20,
    } = req.query;
    const where = {};
    if (protocolo) where.protocolo = { [Op.iLike]: `%${protocolo}%` };
    if (solicitante)
      where.solicitante_nome = { [Op.iLike]: `%${solicitante}%` };
    if (status) where.status = status;
    if (tecnico_id) where.tecnico_id = tecnico_id;
    if (setor_id) where.setor_id = setor_id;
    if (sem_tecnico === "true") where.tecnico_id = null;
    if (data_inicio || data_fim) {
      where.data_abertura = {};
      if (data_inicio) where.data_abertura[Op.gte] = new Date(data_inicio);
      if (data_fim) {
        const df = new Date(data_fim);
        df.setHours(23, 59, 59, 999);
        where.data_abertura[Op.lte] = df;
      }
    }

    const chamados = await Chamado.findAndCountAll({
      where,
      include: [
        { model: Setor, as: "setor", attributes: ["nome"] },
        { model: UsuarioAdmin, as: "tecnico", attributes: ["id", "nome"] },
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

export async function detalhesChamado(req, res) {
  try {
    const { id } = req.params;
    const chamado = await Chamado.findByPk(id, {
      include: [
        { model: Setor, as: "setor", attributes: ["nome"] },
        { model: UsuarioAdmin, as: "tecnico", attributes: ["id", "nome"] },
      ],
    });
    if (!chamado)
      return res.status(404).json({ error: "Chamado não encontrado" });

    const historico = await HistoricoChamado.findAll({
      where: { chamado_id: id },
      include: [{ model: UsuarioAdmin, as: "usuario", attributes: ["nome"] }],
      order: [["data_evento", "ASC"]],
    });

    const observacoes = await ObservacaoInterna.findAll({
      where: { chamado_id: id },
      include: [{ model: UsuarioAdmin, as: "usuario", attributes: ["nome"] }],
      order: [["data_criacao", "ASC"]],
    });

    return res.json({ chamado, historico, observacoes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function alterarStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const statusValidos = ["Aberto", "Em andamento", "Fechado"];
    if (!statusValidos.includes(status))
      return res.status(400).json({ error: "Status inválido" });

    const chamado = await Chamado.findByPk(id);
    if (!chamado)
      return res.status(404).json({ error: "Chamado não encontrado" });

    const statusAntigo = chamado.status;
    const updates = { status, data_atualizacao: new Date() };
    if (status === "Em andamento" && statusAntigo !== "Em andamento")
      updates.data_inicio_atendimento = new Date();
    if (status === "Fechado") updates.data_fechamento = new Date();

    await chamado.update(updates);
    await HistoricoChamado.create({
      chamado_id: id,
      usuario_id: req.usuario.id,
      tipo_evento: "status_alterado",
      descricao: `Status alterado de "${statusAntigo}" para "${status}"`,
      data_evento: new Date(),
    });

    return res.json({ message: "Status atualizado", chamado });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function atribuirTecnico(req, res) {
  try {
    const { id } = req.params;
    const { tecnico_id } = req.body;

    const chamado = await Chamado.findByPk(id);
    if (!chamado)
      return res.status(404).json({ error: "Chamado não encontrado" });

    if (tecnico_id) {
      const tecnico = await UsuarioAdmin.findOne({
        where: { id: tecnico_id, ativo: true },
      });
      if (!tecnico)
        return res.status(400).json({ error: "Técnico não encontrado" });
    }

    await chamado.update({
      tecnico_id: tecnico_id || null,
      data_atualizacao: new Date(),
    });

    const tecnico = tecnico_id ? await UsuarioAdmin.findByPk(tecnico_id) : null;
    await HistoricoChamado.create({
      chamado_id: id,
      usuario_id: req.usuario.id,
      tipo_evento: "tecnico_atribuido",
      descricao: tecnico
        ? `Técnico "${tecnico.nome}" atribuído ao chamado`
        : "Técnico removido do chamado",
      data_evento: new Date(),
    });

    return res.json({ message: "Técnico atualizado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function adicionarObservacao(req, res) {
  try {
    const { id } = req.params;
    const { observacao } = req.body;
    if (!observacao)
      return res.status(400).json({ error: "Observação é obrigatória" });

    const chamado = await Chamado.findByPk(id);
    if (!chamado)
      return res.status(404).json({ error: "Chamado não encontrado" });

    const obs = await ObservacaoInterna.create({
      chamado_id: id,
      usuario_id: req.usuario.id,
      observacao,
      data_criacao: new Date(),
    });

    await HistoricoChamado.create({
      chamado_id: id,
      usuario_id: req.usuario.id,
      tipo_evento: "observacao_adicionada",
      descricao: "Observação interna adicionada",
      data_evento: new Date(),
    });

    return res.status(201).json(obs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function historicoChamado(req, res) {
  try {
    const { id } = req.params;
    const historico = await HistoricoChamado.findAll({
      where: { chamado_id: id },
      include: [{ model: UsuarioAdmin, as: "usuario", attributes: ["nome"] }],
      order: [["data_evento", "ASC"]],
    });
    return res.json(historico);
  } catch (err) {
    return res.status(500).json({ error: "Erro interno" });
  }
}

// Setores Admin
export async function listarSetoresAdmin(req, res) {
  try {
    const setores = await Setor.findAll({ order: [["nome", "ASC"]] });
    return res.json(setores);
  } catch (err) {
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function criarSetor(req, res) {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });
    const setor = await Setor.create({
      nome,
      ativo: true,
      data_criacao: new Date(),
      data_atualizacao: new Date(),
    });
    return res.status(201).json(setor);
  } catch (err) {
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function editarSetor(req, res) {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    const setor = await Setor.findByPk(id);
    if (!setor) return res.status(404).json({ error: "Setor não encontrado" });
    await setor.update({ nome, data_atualizacao: new Date() });
    return res.json(setor);
  } catch (err) {
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function alterarStatusSetor(req, res) {
  try {
    const { id } = req.params;
    const setor = await Setor.findByPk(id);
    if (!setor) return res.status(404).json({ error: "Setor não encontrado" });
    await setor.update({ ativo: !setor.ativo, data_atualizacao: new Date() });
    return res.json(setor);
  } catch (err) {
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function listarTecnicos(req, res) {
  try {
    const tecnicos = await UsuarioAdmin.findAll({
      where: { ativo: true },
      attributes: ["id", "nome", "perfil"],
    });
    return res.json(tecnicos);
  } catch (err) {
    return res.status(500).json({ error: "Erro interno" });
  }
}
