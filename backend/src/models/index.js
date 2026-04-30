import { DataTypes } from "sequelize";
import sequelize from "../database.js";

export const Setor = sequelize.define(
  "setor",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
    data_criacao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    data_atualizacao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: false, tableName: "setor" },
);

export const UsuarioAdmin = sequelize.define(
  "usuario_admin",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    senha_hash: { type: DataTypes.STRING(255), allowNull: false },
    perfil: {
      type: DataTypes.ENUM("admin", "tecnico"),
      defaultValue: "tecnico",
    },
    ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
    data_criacao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: false, tableName: "usuarios_admin" },
);

export const Chamado = sequelize.define(
  "chamado",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    protocolo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    empresa_nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    empresa_documento: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    setor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    solicitante_nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    solicitante_cpf: {
      type: DataTypes.STRING(11),
      allowNull: false,
    },

    solicitante_whatsapp: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    prioridade: {
      type: DataTypes.ENUM("Baixa", "Média", "Alta"),
      allowNull: false,
      defaultValue: "Baixa",
    },
    status: {
      type: DataTypes.ENUM("Aberto", "Em andamento", "Fechado"),
      defaultValue: "Aberto",
    },
    tecnico_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    data_abertura: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    data_inicio_atendimento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    data_fechamento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    data_atualizacao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  { timestamps: false, tableName: "chamado" },
);

export const HistoricoChamado = sequelize.define(
  "historico_chamado",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    chamado_id: { type: DataTypes.INTEGER, allowNull: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: true },
    tipo_evento: { type: DataTypes.STRING(50), allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: false },
    prioridade: {
      type: DataTypes.ENUM("Baixa", "Média", "Alta"),
      allowNull: true,
    },
    data_evento: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: false, tableName: "historico_chamados" },
);

export const ObservacaoInterna = sequelize.define(
  "observacao_interna",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    chamado_id: { type: DataTypes.INTEGER, allowNull: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    observacao: { type: DataTypes.TEXT, allowNull: false },
    data_criacao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: false, tableName: "observacoes_internas" },
);

Chamado.belongsTo(Setor, { foreignKey: "setor_id", as: "setor" });
Chamado.belongsTo(UsuarioAdmin, { foreignKey: "tecnico_id", as: "tecnico" });
HistoricoChamado.belongsTo(UsuarioAdmin, {
  foreignKey: "usuario_id",
  as: "usuario",
});
ObservacaoInterna.belongsTo(UsuarioAdmin, {
  foreignKey: "usuario_id",
  as: "usuario",
});

export default {
  Setor,
  UsuarioAdmin,
  Chamado,
  HistoricoChamado,
  ObservacaoInterna,
};
