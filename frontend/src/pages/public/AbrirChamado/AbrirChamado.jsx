import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../../../services/api";
import PublicLayout from "../../../components/PublicLayout/PublicLayout";
import "./AbrirChamado.css";

const schema = z.object({
  empresa_nome: z.string().min(2, "Nome da empresa obrigatório"),
  empresa_documento: z.string().min(11, "CNPJ ou CPF obrigatório").max(18),
  setor_id: z.string().min(1, "Selecione um setor"),
  solicitante_nome: z.string().min(2, "Nome do solicitante obrigatório"),
  solicitante_whatsapp: z
    .string()
    .min(10, "WhatsApp inválido")
    .regex(/^[\d\s\+\-\(\)]{10,20}$/, "WhatsApp inválido"),
  titulo: z.string().min(5, "Título obrigatório (mín. 5 caracteres)"),
  descricao: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
});

export default function AbrirChamado() {
  const navigate = useNavigate();
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    api
      .get("/setores")
      .then((r) => {
        console.log("Setores retornados:", r.data);
        setSetores(r.data);
      })
      .catch((err) => {
        console.error("Erro ao buscar setores:", err);
      });
  }, []);

  async function onSubmit(data) {
    setLoading(true);
    setApiError("");

    try {
      const res = await api.post("/chamados", data);

      navigate(`/chamado/confirmacao/${res.data.protocolo}`, {
        state: res.data,
      });
    } catch (err) {
      setApiError(
        err.response?.data?.error || "Erro ao abrir chamado. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="abrir-chamado-container">
        <div className="abrir-chamado-header">
          <h1 className="abrir-chamado-title">Abrir Chamado</h1>

          <p className="abrir-chamado-subtitle">
            Preencha o formulário para registrar sua solicitação de suporte.
          </p>
        </div>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card abrir-chamado-card">
            <h3 className="abrir-chamado-section-title">Dados da Empresa</h3>

            <div className="abrir-chamado-form-grid">
              <div className="form-group abrir-chamado-full-row">
                <label>Nome da Empresa *</label>

                <input
                  {...register("empresa_nome")}
                  placeholder="Razão social ou nome fantasia"
                />

                {errors.empresa_nome && (
                  <p className="error-msg">{errors.empresa_nome.message}</p>
                )}
              </div>

              <div className="form-group">
                <label>CNPJ ou CPF *</label>

                <input
                  {...register("empresa_documento")}
                  placeholder="00.000.000/0000-00"
                />

                {errors.empresa_documento && (
                  <p className="error-msg">
                    {errors.empresa_documento.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Setor *</label>

                <select {...register("setor_id")}>
                  <option value="">Selecione o setor</option>

                  {setores.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>

                {errors.setor_id && (
                  <p className="error-msg">{errors.setor_id.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card abrir-chamado-card">
            <h3 className="abrir-chamado-section-title">
              Dados do Solicitante
            </h3>

            <div className="abrir-chamado-form-grid">
              <div className="form-group abrir-chamado-full-row">
                <label>Nome Completo *</label>

                <input
                  {...register("solicitante_nome")}
                  placeholder="Seu nome completo"
                />

                {errors.solicitante_nome && (
                  <p className="error-msg">{errors.solicitante_nome.message}</p>
                )}
              </div>

              <div className="form-group abrir-chamado-full-row">
                <label>WhatsApp *</label>

                <input
                  {...register("solicitante_whatsapp")}
                  placeholder="(11) 99999-9999"
                />

                {errors.solicitante_whatsapp && (
                  <p className="error-msg">
                    {errors.solicitante_whatsapp.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card abrir-chamado-card abrir-chamado-details-card">
            <h3 className="abrir-chamado-section-title">
              Detalhes do Problema
            </h3>

            <div className="form-group">
              <label>Título *</label>

              <input
                {...register("titulo")}
                placeholder="Descreva brevemente o problema"
              />

              {errors.titulo && (
                <p className="error-msg">{errors.titulo.message}</p>
              )}
            </div>

            <div className="form-group">
              <label>Descrição detalhada *</label>

              <textarea
                {...register("descricao")}
                rows={5}
                placeholder="Descreva com detalhes o que está acontecendo, quando começou, e qualquer informação relevante..."
              />

              {errors.descricao && (
                <p className="error-msg">{errors.descricao.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary abrir-chamado-submit"
            disabled={loading}
          >
            {loading ? "Enviando..." : "→ Abrir Chamado"}
          </button>
        </form>
      </div>
    </PublicLayout>
  );
}