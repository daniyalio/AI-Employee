import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { runAgent } from "../api/taskApi";
import { getActivities, type Activity } from "../api/activityApi";
import { useTasks } from "../hooks/useTasks";
import { TaskList } from "../components/TaskList";
import { StatsGrid } from "../components/StatsGrid";
import { AgentActivity } from "../components/AgentActivity";
import "./Dashboard.css";

export default function Dashboard() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { tasks, loading, addTask, changeStatus } = useTasks();
  const [command, setCommand] = useState("");
  const [result, setResult] = useState("");
  const [notice, setNotice] = useState("Your AI employee is online and ready.");
  const [running, setRunning] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);

  async function loadActivities() {
    try {
      const response = await getActivities();
      setActivities(response.activities);
    } catch {
      setActivities([]);
    }
  }

  useEffect(() => {
    void loadActivities();
  }, []);

  async function handleCommand() {
    const value = command.trim();
    if (!value || running) return;

    setRunning(true);
    setCommand("");
    setResult("");
    setNotice("Your AI employee is working…");

    try {
      const response = await runAgent(value);
      setResult(response.output);
      setNotice("The AI employee finished the request.");
      await addTask(value);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The AI employee could not complete the request.");
    } finally {
      setRunning(false);
      await loadActivities();
    }
  }

  function signOut() {
    logout();
    navigate("/login");
  }

  const firstName = session?.user.name.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="employee-app">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span>AI Employee</div>
        <div className="online"><span /> Online</div>
        <nav><button className="nav-item active">⌂ Overview</button><button className="nav-item">✓ Tasks</button><button className="nav-item">◷ Activity</button><button className="nav-item">⚡ Automations</button><button className="nav-item">◈ Integrations</button></nav>
        <div className="sidebar-bottom"><div className="agent-card"><div className="agent-avatar">AI</div><div><strong>Employee mode</strong><small>Autonomous · supervised</small></div></div><button className="logout" onClick={signOut}>↪ Sign out</button></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div><p className="eyebrow">WORKSPACE / TODAY</p><h1>{greeting}, {firstName}.</h1></div><div className="user-chip"><div className="avatar">{firstName[0]?.toUpperCase()}</div><div><strong>{session?.user.name}</strong><small>{session?.user.email}</small></div></div></header>

        <section className="hero-card"><div className="hero-copy"><div className="status-pill"><span /> AI EMPLOYEE ACTIVE</div><h2>Tell me what needs to get done.</h2><p>Delegate research, writing, organization, analysis, and routine follow-ups.</p></div><div className="hero-orb"><span>✦</span></div><div className="command-box"><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void handleCommand()} placeholder="e.g. Research our competitors and summarize the key differences"/><button onClick={() => void handleCommand()} disabled={running}>{running ? "Working…" : <>Run task <span>→</span></>}</button></div></section>

        <p className="notice"><span>✦</span>{notice}</p>
        {result && <section className="agent-result"><div className="result-head"><span className="result-icon">✦</span><div><p className="eyebrow">AGENT RESULT</p><strong>Work plan / response</strong></div></div><p>{result}</p></section>}

        <StatsGrid tasks={tasks} />

        <div className="content-grid"><section className="panel"><div className="panel-head"><div><p className="eyebrow">WORK QUEUE</p><h3>Tasks</h3></div></div><TaskList tasks={tasks} loading={loading} onStatusChange={(task) => void changeStatus(task)} /></section><section className="panel activity-panel"><div className="panel-head"><div><p className="eyebrow">LIVE FEED</p><h3>Agent activity</h3></div><span className="live-dot">LIVE</span></div><AgentActivity activities={activities} /></section></div>

        <section className="approval"><div className="approval-icon">!</div><div><p className="eyebrow">NEEDS YOUR INPUT</p><h3>Approval system is coming next</h3><p>External actions such as sending email will require your approval.</p></div></section>
      </main>
    </div>
  );
}