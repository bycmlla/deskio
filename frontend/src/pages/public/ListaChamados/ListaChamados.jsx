import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import PublicLayout from "../../../components/PublicLayout/PublicLayout";
import StatusBadge from "../../../components/ui/StatusBadge";
import Spinner from "../../../components/ui/Spinner";
import "./ListaChamados.css";

export default function ListaChamados() {
  const navigate = useNavigate();

  const [chamados, setChamados] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams({ page: pagina, limit: 20 });

    if (filtroStatus) params.append("status", filtroStatus);

    api
      .get(`/chamados?${params}`)
      .then((r) => {
        setChamados(r.data.chamados);
        setTotal(r.data.total);
      })
      .finally(() => setLoading(false));
  }, [filtroStatus, pagina]);

  const fmt = (dt) => new Date(dt).toLocaleDateString("pt-BR");

  const totalPaginas = Math.ceil(total / 20);

  return (
    <PublicLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Chamados</h1>

          <p className="page-subtitle">
            {total} chamado{total !== 1 ? "s" : ""} encontrado
            {total !== 1 ? "s" : ""}
          </p>
        </div>

        <Link to="/" className="btn btn-primary">
          + Novo Chamado
        </Link>
      </div>

      <div className="filters-row lista-chamados-filters-row">
        <select
          className="lista-chamados-status-select"
          value={filtroStatus}
          onChange={(e) => {
            setFiltroStatus(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todos os status</option>
          <option value="Aberto">Aberto</option>
          <option value="Em andamento">Em andamento</option>
          <option value="Fechado">Fechado</option>
        </select>
      </div>

      <div className="card lista-chamados-table-card">
        {loading ? (
          <Spinner />
        ) : chamados.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum chamado encontrado</h3>
            <p>Tente alterar os filtros ou abra um novo chamado.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Título</th>
                  <th>Status</th>
                  <th>Data de Abertura</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {chamados.map((chamado) => (
                  <tr
                    key={chamado.protocolo}
                    className="lista-chamados-row"
                    onClick={() => navigate(`/chamado/${chamado.protocolo}`)}
                  >
                    <td>
                      <span className="lista-chamados-protocolo">
                        {chamado.protocolo}
                      </span>
                    </td>

                    <td className="lista-chamados-titulo-cell">
                      <span className="lista-chamados-titulo">
                        {chamado.titulo}
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={chamado.status} />
                    </td>

                    <td className="lista-chamados-data">
                      {fmt(chamado.data_abertura)}
                    </td>

                    <td>
                      <Link
                        to={`/chamado/${chamado.protocolo}`}
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="lista-chamados-paginacao">
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagina === 1}
            onClick={() => setPagina((paginaAtual) => paginaAtual - 1)}
          >
            ← Anterior
          </button>

          <span className="lista-chamados-paginacao-texto">
            {pagina} / {totalPaginas}
          </span>

          <button
            className="btn btn-secondary btn-sm"
            disabled={pagina === totalPaginas}
            onClick={() => setPagina((paginaAtual) => paginaAtual + 1)}
          >
            Próxima →
          </button>
        </div>
      )}
    </PublicLayout>
  );
}