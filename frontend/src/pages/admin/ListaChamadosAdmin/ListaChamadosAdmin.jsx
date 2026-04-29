import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../../services/api";
import AdminLayout from "../../../components/AdminLayout/AdminLayout";
import StatusBadge from "../../../components/ui/StatusBadge";
import Spinner from "../../../components/ui/Spinner";
import "./ListaChamadosAdmin.css";

export default function ListaChamadosAdmin() {
  const [searchParams] = useSearchParams();
  const [chamados, setChamados] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [tecnicos, setTecnicos] = useState([]);
  const [setores, setSetores] = useState([]);

  const [filtros, setFiltros] = useState({
    protocolo: "",
    solicitante: "",
    status: searchParams.get("status") || "",
    tecnico_id: "",
    setor_id: "",
    data: "",
  });

  useEffect(() => {
    api
      .get("/admin/tecnicos")
      .then((r) => setTecnicos(r.data))
      .catch(() => {});

    api
      .get("/admin/setores")
      .then((r) => setSetores(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams({ page: pagina, limit: 20 });

    Object.entries(filtros).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    api
      .get(`/admin/chamados?${params}`)
      .then((r) => {
        setChamados(r.data.chamados);
        setTotal(r.data.total);
      })
      .finally(() => setLoading(false));
  }, [filtros, pagina]);

  const fmt = (dt) => (dt ? new Date(dt).toLocaleDateString("pt-BR") : "—");

  const totalPaginas = Math.ceil(total / 20);

  function setFiltro(key, value) {
    setFiltros((filtrosAtuais) => ({
      ...filtrosAtuais,
      [key]: value,
    }));

    setPagina(1);
  }

  function limparFiltros() {
    setFiltros({
      protocolo: "",
      solicitante: "",
      status: "",
      tecnico_id: "",
      setor_id: "",
      data: "",
    });

    setPagina(1);
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Chamados</h1>

          <p className="page-subtitle">
            {total} resultado{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="card lista-chamados-filtros-card">
        <div className="lista-chamados-filtros-grid">
          <input
            placeholder="Protocolo"
            value={filtros.protocolo}
            onChange={(e) => setFiltro("protocolo", e.target.value)}
          />

          <input
            placeholder="Solicitante"
            value={filtros.solicitante}
            onChange={(e) => setFiltro("solicitante", e.target.value)}
          />

          <select
            value={filtros.status}
            onChange={(e) => setFiltro("status", e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="Aberto">Aberto</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Fechado">Fechado</option>
          </select>

          <select
            value={filtros.tecnico_id}
            onChange={(e) => setFiltro("tecnico_id", e.target.value)}
          >
            <option value="">Todos os técnicos</option>

            {tecnicos.map((tecnico) => (
              <option key={tecnico.id} value={tecnico.id}>
                {tecnico.nome}
              </option>
            ))}
          </select>

          <select
            value={filtros.setor_id}
            onChange={(e) => setFiltro("setor_id", e.target.value)}
          >
            <option value="">Todos os setores</option>

            {setores.map((setor) => (
              <option key={setor.id} value={setor.id}>
                {setor.nome}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filtros.data}
            onChange={(e) => setFiltro("data", e.target.value)}
            title="Data de abertura"
          />
        </div>

        <div className="lista-chamados-filtros-actions">
          <button className="btn btn-ghost btn-sm" onClick={limparFiltros}>
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="card lista-chamados-table-card">
        {loading ? (
          <Spinner />
        ) : chamados.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum chamado encontrado</h3>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Título</th>
                  <th>Solicitante</th>
                  <th>Setor</th>
                  <th>Status</th>
                  <th>Técnico</th>
                  <th>Abertura</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {chamados.map((chamado) => (
                  <tr key={chamado.id}>
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

                    <td>{chamado.solicitante_nome}</td>

                    <td className="lista-chamados-muted">
                      {chamado.setor?.nome || "—"}
                    </td>

                    <td>
                      <StatusBadge status={chamado.status} />
                    </td>

                    <td
                      className={
                        chamado.tecnico
                          ? "lista-chamados-tecnico"
                          : "lista-chamados-tecnico lista-chamados-tecnico-vazio"
                      }
                    >
                      {chamado.tecnico?.nome || "Não atribuído"}
                    </td>

                    <td className="lista-chamados-data">
                      {fmt(chamado.data_abertura)}
                    </td>

                    <td>
                      <Link
                        to={`/admin/chamados/${chamado.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Abrir
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
    </AdminLayout>
  );
}
