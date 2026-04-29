import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../../services/api";
import AdminLayout from "../../../components/AdminLayout/AdminLayout";
import StatusBadge from "../../../components/ui/StatusBadge";
import Spinner from "../../../components/ui/Spinner";
import "./DetalhesChamadoAdmin.css";

export default function DetalhesChamadoAdmin() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tecnicos, setTecnicos] = useState([]);
  const [novoStatus, setNovoStatus] = useState("");
  const [novoTecnico, setNovoTecnico] = useState("");
  const [novaObs, setNovaObs] = useState("");
  const [salvando, setSalvando] = useState("");

  async function carregar() {
    const [detalhes, techs] = await Promise.all([
      api.get(`/admin/chamados/${id}`),
      api.get("/admin/tecnicos"),
    ]);

    setData(detalhes.data);
    setTecnicos(techs.data);
    setNovoStatus(detalhes.data.chamado.status);
    setNovoTecnico(detalhes.data.chamado.tecnico_id || "");
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, [id]);

  async function salvarStatus() {
    setSalvando("status");

    try {
      await api.patch(`/admin/chamados/${id}/status`, { status: novoStatus });
      await carregar();
    } finally {
      setSalvando("");
    }
  }

  async function salvarTecnico() {
    setSalvando("tecnico");

    try {
      await api.patch(`/admin/chamados/${id}/tecnico`, {
        tecnico_id: novoTecnico || null,
      });

      await carregar();
    } finally {
      setSalvando("");
    }
  }

  async function salvarObs() {
    if (!novaObs.trim()) return;

    setSalvando("obs");

    try {
      await api.post(`/admin/chamados/${id}/observacoes`, {
        observacao: novaObs,
      });

      setNovaObs("");
      await carregar();
    } finally {
      setSalvando("");
    }
  }

  const fmt = (dt) => (dt ? new Date(dt).toLocaleString("pt-BR") : "—");

  if (loading) {
    return (
      <AdminLayout>
        <Spinner />
      </AdminLayout>
    );
  }

  const { chamado, historico, observacoes } = data;

  const tipoEvento = {
    criacao: { label: "Chamado criado", color: "var(--accent)" },
    status_alterado: { label: "Status alterado", color: "var(--warning)" },
    tecnico_atribuido: { label: "Técnico atribuído", color: "var(--success)" },
    observacao_adicionada: { label: "Observação", color: "var(--text-muted)" },
    chamado_fechado: { label: "Chamado fechado", color: "var(--danger)" },
  };

  const dadosChamado = [
    { label: "Empresa", value: chamado.empresa_nome },
    { label: "CNPJ/CPF", value: chamado.empresa_documento },
    { label: "Setor", value: chamado.setor?.nome },
    { label: "Solicitante", value: chamado.solicitante_nome },
    { label: "WhatsApp", value: chamado.solicitante_whatsapp },
    { label: "Abertura", value: fmt(chamado.data_abertura) },
    { label: "Início Atend.", value: fmt(chamado.data_inicio_atendimento) },
    { label: "Fechamento", value: fmt(chamado.data_fechamento) },
  ];

  return (
    <AdminLayout>
      <div className="chamado-admin-header">
        <Link to="/admin/chamados" className="btn btn-ghost btn-sm">
          ← Voltar
        </Link>

        <div className="chamado-admin-header-content">
          <div className="chamado-admin-title-row">
            <h1 className="chamado-admin-protocolo">{chamado.protocolo}</h1>
            <StatusBadge status={chamado.status} />
          </div>

          <p className="chamado-admin-subtitle">{chamado.titulo}</p>
        </div>
      </div>

      <div className="chamado-admin-layout">
        <div>
          <div className="card chamado-admin-card">
            <h3 className="chamado-admin-section-title">Dados do Chamado</h3>

            <div className="chamado-admin-info-grid">
              {dadosChamado.map(({ label, value }) => (
                <div key={label}>
                  <p className="chamado-admin-info-label">{label}</p>
                  <p className="chamado-admin-info-value">{value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card chamado-admin-card">
            <h3 className="chamado-admin-section-title">Descrição</h3>
            <p className="chamado-admin-description">{chamado.descricao}</p>
          </div>

          <div className="card chamado-admin-card">
            <h3 className="chamado-admin-section-title">Histórico</h3>

            {historico.length === 0 ? (
              <p className="chamado-admin-empty">Sem histórico</p>
            ) : (
              <div className="timeline">
                {historico.map((h, i) => {
                  const ev = tipoEvento[h.tipo_evento] || {
                    label: h.tipo_evento,
                    color: "var(--text-muted)",
                  };

                  return (
                    <div key={h.id} className="timeline-item">
                      <div className="timeline-marker-wrapper">
                        <div
                          className="timeline-marker"
                          style={{ "--event-color": ev.color }}
                        />

                        {i < historico.length - 1 && (
                          <div className="timeline-line" />
                        )}
                      </div>

                      <div className="timeline-content">
                        <p
                          className="timeline-title"
                          style={{ "--event-color": ev.color }}
                        >
                          {ev.label}
                        </p>

                        <p className="timeline-description">{h.descricao}</p>

                        <p className="timeline-meta">
                          {fmt(h.data_evento)}
                          {h.usuario && ` · ${h.usuario.nome}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="chamado-admin-section-title">
              Observações Internas
            </h3>

            {observacoes.length > 0 && (
              <div className="observacoes-list">
                {observacoes.map((obs) => (
                  <div key={obs.id} className="observacao-item">
                    <p className="observacao-text">{obs.observacao}</p>

                    <p className="observacao-meta">
                      {obs.usuario?.nome} · {fmt(obs.data_criacao)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <textarea
              className="observacao-textarea"
              value={novaObs}
              onChange={(e) => setNovaObs(e.target.value)}
              placeholder="Adicionar observação interna (não visível ao solicitante)..."
              rows={3}
            />

            <button
              className="btn btn-secondary btn-sm"
              onClick={salvarObs}
              disabled={salvando === "obs" || !novaObs.trim()}
            >
              {salvando === "obs" ? "Salvando..." : "Adicionar Observação"}
            </button>
          </div>
        </div>

        <div>
          <div className="card chamado-admin-card">
            <h3 className="chamado-admin-section-title">Alterar Status</h3>

            <select
              className="chamado-admin-select"
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value)}
            >
              <option value="Aberto">Aberto</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Fechado">Fechado</option>
            </select>

            <button
              className="btn btn-primary btn-sm chamado-admin-full-button"
              onClick={salvarStatus}
              disabled={salvando === "status" || novoStatus === chamado.status}
            >
              {salvando === "status" ? "Salvando..." : "Atualizar Status"}
            </button>
          </div>

          <div className="card chamado-admin-card">
            <h3 className="chamado-admin-section-title">
              Técnico Responsável
            </h3>

            <p
              className={
                chamado.tecnico
                  ? "tecnico-atual"
                  : "tecnico-atual tecnico-atual-vazio"
              }
            >
              {chamado.tecnico?.nome || "Ainda não atribuído"}
            </p>

            <select
              className="chamado-admin-select"
              value={novoTecnico}
              onChange={(e) => setNovoTecnico(e.target.value)}
            >
              <option value="">Remover técnico</option>

              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({t.perfil})
                </option>
              ))}
            </select>

            <button
              className="btn btn-secondary btn-sm chamado-admin-full-button"
              onClick={salvarTecnico}
              disabled={salvando === "tecnico"}
            >
              {salvando === "tecnico" ? "Salvando..." : "Atribuir Técnico"}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}