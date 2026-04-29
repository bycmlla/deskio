import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../../services/api";
import PublicLayout from "../../../components/PublicLayout/PublicLayout";
import StatusBadge from "../../../components/ui/StatusBadge";
import Spinner from "../../../components/ui/Spinner";
import "./DetalhesChamado.css";

export default function DetalhesChamado() {
  const { protocolo } = useParams();
  const [chamado, setChamado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api
      .get(`/chamados/${protocolo}`)
      .then((r) => setChamado(r.data))
      .catch(() => setErro("Chamado não encontrado"))
      .finally(() => setLoading(false));
  }, [protocolo]);

  const fmt = (dt) => (dt ? new Date(dt).toLocaleString("pt-BR") : "—");

  if (loading) {
    return (
      <PublicLayout>
        <Spinner />
      </PublicLayout>
    );
  }

  if (erro) {
    return (
      <PublicLayout>
        <div className="empty-state">
          <h3>Chamado não encontrado</h3>

          <p>Verifique o protocolo e tente novamente.</p>

          <Link to="/" className="btn btn-primary detalhes-chamado-voltar">
            Voltar
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const dadosChamado = [
    { label: "Solicitante", value: chamado.solicitante_nome },
    { label: "Setor", value: chamado.setor },
    { label: "Data de Abertura", value: fmt(chamado.data_abertura) },
    {
      label: "Técnico Responsável",
      value: chamado.tecnico || "Ainda não atribuído",
    },
  ];

  return (
    <PublicLayout>
      <div className="detalhes-chamado-container">
        <div className="detalhes-chamado-header">
          <div>
            <p className="detalhes-chamado-label">Protocolo</p>

            <h1 className="detalhes-chamado-protocolo">
              {chamado.protocolo}
            </h1>
          </div>

          <StatusBadge status={chamado.status} />
        </div>

        <div className="card detalhes-chamado-card">
          <h2 className="detalhes-chamado-titulo">{chamado.titulo}</h2>

          <div className="detalhes-chamado-info-grid">
            {dadosChamado.map(({ label, value }) => (
              <div key={label}>
                <p className="detalhes-chamado-info-label">{label}</p>

                <p
                  className={
                    value === "Ainda não atribuído"
                      ? "detalhes-chamado-info-value detalhes-chamado-info-value-empty"
                      : "detalhes-chamado-info-value"
                  }
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card detalhes-chamado-description-card">
          <h3 className="detalhes-chamado-section-title">Descrição</h3>

          <p className="detalhes-chamado-description">{chamado.descricao}</p>
        </div>

        <div className="detalhes-chamado-actions">
          <Link to="/chamados" className="btn btn-secondary">
            ← Ver todos os chamados
          </Link>

          <Link to="/" className="btn btn-primary">
            Abrir Novo Chamado
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}