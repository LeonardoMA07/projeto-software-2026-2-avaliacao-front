import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useState } from "react";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";

// Em dev o Vite faz proxy de /api para o back; na Vercel quem faz é o vercel.json
const API_URL = "/api";
const ROLES_CLAIM = "https://social-insper.com/roles";
const FORM_VAZIO = { emailAvaliado: "", nota: "", comentarios: "" };

function lerPapeis(token) {
  const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(payload))[ROLES_CLAIM] || [];
}

function mensagemDeErro(status, acao) {
  if (status === 401) return `Não autenticado ao ${acao}. Faça login novamente.`;
  if (status === 403) return `Sem permissão para ${acao}.`;
  if (status === 400) return "Dados inválidos: confira os e-mails e se a nota está entre 0 e 10.";
  return `Erro ao ${acao} (HTTP ${status}).`;
}

export default function App() {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [token, setToken] = useState("");
  const [papeis, setPapeis] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const isAdmin = papeis.includes("ADMIN");

  useEffect(() => {
    if (!isAuthenticated) return;
    getAccessTokenSilently()
      .then((accessToken) => {
        setToken(accessToken);
        setPapeis(lerPapeis(accessToken));
      })
      .catch((e) => setErro("Erro ao obter o token: " + e.message));
  }, [isAuthenticated, getAccessTokenSilently]);

  const carregarAvaliacoes = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await fetch(`${API_URL}/avaliacoes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resposta.ok) throw new Error(mensagemDeErro(resposta.status, "listar avaliações"));
      setAvaliacoes(await resposta.json());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) carregarAvaliacoes();
  }, [token, carregarAvaliacoes]);

  const alterarCampo = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const cadastrar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      const resposta = await fetch(`${API_URL}/avaliacoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          emailAvaliador: user.email,
          emailAvaliado: form.emailAvaliado,
          nota: Number(form.nota),
          comentarios: form.comentarios,
        }),
      });
      if (!resposta.ok) throw new Error(mensagemDeErro(resposta.status, "cadastrar avaliação"));
      const nova = await resposta.json();
      setAvaliacoes([nova, ...avaliacoes]);
      setForm(FORM_VAZIO);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };

  if (isLoading) return <main className="centro">Carregando...</main>;

  if (!isAuthenticated) {
    return (
      <main className="centro">
        <h1>Sistema de Avaliações</h1>
        <p>Entre com sua conta para ver e cadastrar avaliações.</p>
        <LoginButton />
      </main>
    );
  }

  return (
    <main className="pagina">
      <header className="cartao topo">
        <div>
          <h1>Avaliações</h1>
          <p className="sutil">
            {user.email} · {papeis.length ? papeis.join(", ") : "sem papel"}
          </p>
        </div>
        <LogoutButton />
      </header>

      {erro && <div className="erro">{erro}</div>}

      {isAdmin && (
        <section className="cartao">
          <h2>Nova avaliação</h2>
          <form onSubmit={cadastrar} className="formulario">
            <label>
              Avaliador
              <input value={user.email} disabled />
            </label>
            <label>
              E-mail do avaliado
              <input
                type="email"
                name="emailAvaliado"
                value={form.emailAvaliado}
                onChange={alterarCampo}
                placeholder="pessoa@empresa.com"
                required
              />
            </label>
            <label>
              Nota (0 a 10)
              <input
                type="number"
                name="nota"
                min="0"
                max="10"
                value={form.nota}
                onChange={alterarCampo}
                required
              />
            </label>
            <label className="inteiro">
              Comentários
              <textarea
                name="comentarios"
                rows="3"
                value={form.comentarios}
                onChange={alterarCampo}
                placeholder="O que essa pessoa fez bem e o que pode melhorar?"
              />
            </label>
            <button type="submit" disabled={enviando || !token}>
              {enviando ? "Salvando..." : "Cadastrar avaliação"}
            </button>
          </form>
        </section>
      )}

      <section className="cartao">
        <div className="titulo-lista">
          <h2>Avaliações cadastradas</h2>
          <button onClick={carregarAvaliacoes} disabled={carregando || !token}>
            Atualizar
          </button>
        </div>
        {carregando ? (
          <p className="sutil">Carregando avaliações...</p>
        ) : avaliacoes.length === 0 ? (
          <p className="sutil">Nenhuma avaliação cadastrada ainda.</p>
        ) : (
          <div className="tabela">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Avaliador</th>
                  <th>Avaliado</th>
                  <th>Nota</th>
                  <th>Comentários</th>
                </tr>
              </thead>
              <tbody>
                {avaliacoes.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.dataAvaliacao).toLocaleString("pt-BR")}</td>
                    <td>{a.emailAvaliador}</td>
                    <td>{a.emailAvaliado}</td>
                    <td className="nota">{a.nota}</td>
                    <td>{a.comentarios}</td>
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
