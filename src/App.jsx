import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useState } from "react";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";

// Em dev o Vite faz proxy de /api para o back; na Vercel quem faz é o vercel.json
const API_URL = "/api";
const ROLES_CLAIM = "https://social-insper.com/roles";
// O e-mail não entra no formulário: vai automático com o e-mail de quem está logado
const FORM_VAZIO = { titulo: "", description: "", prioridade: "" };

function lerPapeis(token) {
  const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(payload))[ROLES_CLAIM] || [];
}

function mensagemDeErro(status, acao) {
  if (status === 401) return `Não autenticado ao ${acao}. Faça login novamente.`;
  if (status === 403) return `Sem permissão para ${acao}.`;
  if (status === 400) return "Dados inválidos: confira o título e a prioridade.";
  return `Erro ao ${acao} (HTTP ${status}).`;
}

export default function App() {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [token, setToken] = useState("");
  const [papeis, setPapeis] = useState([]);
  const [Tarefas, setTarefas] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    getAccessTokenSilently()
      .then((accessToken) => {
        setToken(accessToken);
        setPapeis(lerPapeis(accessToken));
      })
      .catch((e) => setErro("Erro ao obter o token: " + e.message));
  }, [isAuthenticated, getAccessTokenSilently]);

  const carregarTarefas = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await fetch(`${API_URL}/tarefa`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resposta.ok) throw new Error(mensagemDeErro(resposta.status, "listar tarefas"));
      setTarefas(await resposta.json());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) carregarTarefas();
  }, [token, carregarTarefas]);

  const alterarCampo = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const cadastrar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      const resposta = await fetch(`${API_URL}/tarefa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: form.titulo,
          description: form.description,
          prioridade: Number(form.prioridade),
          emailResponsavel: user.email,
        }),
      });
      if (!resposta.ok) throw new Error(mensagemDeErro(resposta.status, "cadastrar tarefa"));
      const nova = await resposta.json();
      setTarefas([nova, ...Tarefas]);
      setForm(FORM_VAZIO);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const excluir = async (id) => {
    setErro("");
    try {
      const resposta = await fetch(`${API_URL}/tarefa/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resposta.ok) throw new Error(mensagemDeErro(resposta.status, "excluir tarefa"));
      setTarefas(Tarefas.filter((t) => t.id !== id));
    } catch (e) {
      setErro(e.message);
    }
  };

  if (isLoading) return <main className="centro">Carregando...</main>;

  if (!isAuthenticated) {
    return (
      <main className="centro">
        <h1>Sistema de Tarefas</h1>
        <p>Entre com sua conta para ver e cadastrar tarefas.</p>
        <LoginButton />
      </main>
    );
  }

  return (
    <main className="pagina">
      <header className="cartao topo">
        <div>
          <h1>Tarefas</h1>
          <p className="sutil">
            {user.email} · {papeis.length ? papeis.join(", ") : "sem papel"}
          </p>
        </div>
        <LogoutButton />
      </header>

      {erro && <div className="erro">{erro}</div>}

      <section className="cartao">
        <h2>Nova Tarefa</h2>
        <form onSubmit={cadastrar} className="formulario">
          <label>
            Título
            <input name="titulo" value={form.titulo} onChange={alterarCampo} required />
          </label>
          <label>
            Prioridade (1 a 5)
            <input
              type="number"
              name="prioridade"
              min="1"
              max="5"
              value={form.prioridade}
              onChange={alterarCampo}
              required
            />
          </label>
          <label className="inteiro">
            Descrição
            <textarea
              name="description"
              rows="3"
              value={form.description}
              onChange={alterarCampo}
            />
          </label>
          <button type="submit" disabled={enviando || !token}>
            {enviando ? "Salvando..." : "Cadastrar tarefa"}
          </button>
        </form>
      </section>

      <section className="cartao">
        <div className="titulo-lista">
          <h2>Tarefas cadastradas</h2>
          <button onClick={carregarTarefas} disabled={carregando || !token}>
            Atualizar
          </button>
        </div>
        {carregando ? (
          <p className="sutil">Carregando tarefas...</p>
        ) : Tarefas.length === 0 ? (
          <p className="sutil">Nenhuma tarefa cadastrada ainda.</p>
        ) : (
          <div className="tabela">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Descrição</th>
                  <th>Prioridade</th>
                  <th>Criado por</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {Tarefas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.titulo}</td>
                    <td>{t.description}</td>
                    <td className="nota">{t.prioridade}</td>
                    <td>{t.emailResponsavel}</td>
                    <td>
                      <button onClick={() => excluir(t.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
