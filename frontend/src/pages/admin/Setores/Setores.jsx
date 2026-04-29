import { useEffect, useState } from "react";
import api from "../../../services/api";
import AdminLayout from "../../../components/AdminLayout/AdminLayout";
import Spinner from "../../../components/ui/Spinner";
import "./Setores.css";

export default function Setores() {
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [editando, setEditando] = useState(null);
  const [nomeEdit, setNomeEdit] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const r = await api.get("/admin/setores");
    setSetores(r.data);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criarSetor() {
    if (!nome.trim()) return;

    setSalvando(true);

    await api.post("/admin/setores", { nome });

    setNome("");
    await carregar();
    setSalvando(false);
  }

  async function editarSetor(id) {
    if (!nomeEdit.trim()) return;

    await api.patch(`/admin/setores/${id}`, { nome: nomeEdit });

    setEditando(null);
    await carregar();
  }

  async function toggleStatus(id) {
    await api.patch(`/admin/setores/${id}/status`);
    await carregar();
  }

  const fmt = (dt) => new Date(dt).toLocaleDateString("pt-BR");

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Setores</h1>
          <p className="page-subtitle">Gerencie os setores da empresa</p>
        </div>
      </div>

      <div className="setores-layout">
        <div className="card setores-table-card">
          {loading ? (
            <Spinner />
          ) : setores.length === 0 ? (
            <div className="empty-state">
              <h3>Nenhum setor cadastrado</h3>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {setores.map((setor) => (
                  <tr key={setor.id}>
                    <td>
                      {editando === setor.id ? (
                        <div className="setores-edit-row">
                          <input
                            value={nomeEdit}
                            onChange={(e) => setNomeEdit(e.target.value)}
                            className="setores-edit-input"
                            autoFocus
                          />

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => editarSetor(setor.id)}
                          >
                            Salvar
                          </button>

                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditando(null)}
                          >
                            Fechar
                          </button>
                        </div>
                      ) : (
                        setor.nome
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          setor.ativo
                            ? "setores-status setores-status-ativo"
                            : "setores-status setores-status-inativo"
                        }
                      >
                        {setor.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td className="setores-data">{fmt(setor.data_criacao)}</td>

                    <td>
                      <div className="setores-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setEditando(setor.id);
                            setNomeEdit(setor.nome);
                          }}
                        >
                          Editar
                        </button>

                        <button
                          className={
                            setor.ativo
                              ? "btn btn-ghost btn-sm setores-toggle-button setores-toggle-button-danger"
                              : "btn btn-ghost btn-sm setores-toggle-button setores-toggle-button-success"
                          }
                          onClick={() => toggleStatus(setor.id)}
                        >
                          {setor.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <div className="card">
            <h3 className="setores-card-title">Novo Setor</h3>

            <div className="form-group">
              <label>Nome do Setor</label>

              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Financeiro, TI, RH..."
                onKeyDown={(e) => e.key === "Enter" && criarSetor()}
              />
            </div>

            <button
              className="btn btn-primary setores-create-button"
              onClick={criarSetor}
              disabled={salvando || !nome.trim()}
            >
              {salvando ? "Criando..." : "+ Criar Setor"}
            </button>
          </div>

          <div className="card setores-rules-card">
            <h4 className="setores-rules-title">Regras dos Setores</h4>

            <ul className="setores-rules-list">
              <li>Apenas setores ativos aparecem no formulário público</li>
              <li>Chamados antigos mantêm o setor mesmo se desativado</li>
              <li>Setores inativos não aceitam novos chamados</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
