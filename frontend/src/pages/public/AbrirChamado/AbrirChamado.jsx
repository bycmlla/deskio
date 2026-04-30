import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../../../services/api";
import PublicLayout from "../../../components/PublicLayout/PublicLayout";
import "./AbrirChamado.css";

const EMPRESA_FIXA = {
  nome: "JTD Transportes LTDA",
  documento: "18.805.360/0001-26",
};

function validarCPF(cpf) {
  const cpfLimpo = cpf.replace(/\D/g, "");

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

const schema = z.object({
  setor_id: z.string().min(1, "Selecione um setor"),

  solicitante_nome: z.string().min(2, "Nome do solicitante obrigatório"),

  solicitante_cpf: z
    .string()
    .min(11, "CPF obrigatório")
    .refine((cpf) => validarCPF(cpf), "CPF inválido"),

  solicitante_whatsapp: z
    .string()
    .min(10, "WhatsApp inválido")
    .regex(/^[\d\s\+\-\(\)]{10,20}$/, "WhatsApp inválido"),

  titulo: z.string().min(5, "Título obrigatório (mín. 5 caracteres)"),

  descricao: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),

  prioridade: z.enum(["Baixa", "Média", "Alta"], {
    required_error: "Selecione o nível de prioridade",
    invalid_type_error: "Selecione o nível de prioridade",
  }),
});

export default function AbrirChamado() {
  const navigate = useNavigate();
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { prioridade: "Baixa" },
  });

  const prioridadeSelecionada = watch("prioridade");

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

  function limparCPF(cpf) {
    return String(cpf || "").replace(/\D/g, "");
  }

  async function onSubmit(data) {
    setLoading(true);
    setApiError("");

    const cpfLimpo = limparCPF(data.solicitante_cpf);

    const payload = {
      ...data,
      solicitante_cpf: cpfLimpo,
      empresa_nome: EMPRESA_FIXA.nome,
      empresa_documento: EMPRESA_FIXA.documento,
    };

    try {
      const res = await api.post("/chamados", payload);

      sessionStorage.setItem("cpf_chamados", cpfLimpo);

      navigate(`/chamado/confirmacao/${res.data.protocolo}`, {
        state: {
          ...res.data,
          solicitante_cpf: cpfLimpo,
        },
      });
    } catch (err) {
      setApiError(
        err.response?.data?.error || "Erro ao abrir chamado. Tente novamente.",
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

            <div className="abrir-chamado-empresa-fixa">
              <div>
                <span className="abrir-chamado-empresa-label">Empresa</span>
                <strong>{EMPRESA_FIXA.nome}</strong>
              </div>

              <div>
                <span className="abrir-chamado-empresa-label">CNPJ</span>
                <strong>{EMPRESA_FIXA.documento}</strong>
              </div>
            </div>

            <div className="abrir-chamado-form-grid">
              <div className="form-group abrir-chamado-full-row">
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
                <label>CPF *</label>

                <input
                  {...register("solicitante_cpf")}
                  placeholder="000.000.000-00"
                />

                {errors.solicitante_cpf && (
                  <p className="error-msg">{errors.solicitante_cpf.message}</p>
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

            <div className="form-group">
              <label>Nível de prioridade *</label>

              <select
                {...register("prioridade")}
                className={`abrir-chamado-prioridade-select prioridade-${
                  prioridadeSelecionada || "Baixa"
                }`}
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>

              {errors.prioridade && (
                <p className="error-msg">{errors.prioridade.message}</p>
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
