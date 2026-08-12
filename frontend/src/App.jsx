import { useEffect, useState } from "react";
import "./App.css";
import { API_BASE } from "./constants";
import AboutPageTab from "./components/AboutPageTab";
import TeamPitchersTab from "./components/TeamPitchersTab";
import FreeAgentsTab from "./components/FreeAgentsTab";
import FreeAgentReliefPitchersTab from "./components/FreeAgentReliefPitchersTab";
import StuffScoreTab from "./components/StuffScoreTab";

async function fetchSummaryFor(pitcherId) {
  if (!pitcherId) return [];
  const res = await fetch(`${API_BASE}/pitchers/${pitcherId}/summary`);
  if (!res.ok) throw new Error(`Summary failed: ${res.status}`);
  return res.json();
}

export default function App() {
  const [activeTab, setActiveTab] = useState("about");
  const [error, setError] = useState("");

  const [freeAgentPitchers, setFreeAgentPitchers] = useState([]);
  const [freeAgentReliefPitchers, setFreeAgentReliefPitchers] = useState([]);

  // Team Pitchers tab
  const [teamTabTeam, setTeamTabTeam] = useState("");
  const [teamTabRole, setTeamTabRole] = useState("starter");
  const [teamTabPitchers, setTeamTabPitchers] = useState([]);
  const [teamTabPitcherId, setTeamTabPitcherId] = useState("");
  const [teamTabCompareType, setTeamTabCompareType] = useState("");
  const [teamTabCompareTeam, setTeamTabCompareTeam] = useState("");
  const [teamTabCompareTeamPitchers, setTeamTabCompareTeamPitchers] = useState(
    []
  );
  const [teamTabCompareId, setTeamTabCompareId] = useState("");
  const [teamTabSummary, setTeamTabSummary] = useState([]);
  const [teamTabCompareSummary, setTeamTabCompareSummary] = useState([]);

  // FA starter tab
  const [faStarterId, setFaStarterId] = useState("");
  const [faStarterCompareType, setFaStarterCompareType] = useState("");
  const [faStarterSecondId, setFaStarterSecondId] = useState("");
  const [faStarterTeam, setFaStarterTeam] = useState("");
  const [faStarterTeamPitchers, setFaStarterTeamPitchers] = useState([]);
  const [faStarterTeamPitcherId, setFaStarterTeamPitcherId] = useState("");
  const [faStarterSummary, setFaStarterSummary] = useState([]);
  const [faStarterCompareSummary, setFaStarterCompareSummary] = useState([]);

  // FA relief tab
  const [faReliefId, setFaReliefId] = useState("");
  const [faReliefCompareType, setFaReliefCompareType] = useState("");
  const [faReliefSecondId, setFaReliefSecondId] = useState("");
  const [faReliefTeam, setFaReliefTeam] = useState("");
  const [faReliefTeamPitchers, setFaReliefTeamPitchers] = useState([]);
  const [faReliefTeamPitcherId, setFaReliefTeamPitcherId] = useState("");
  const [faReliefSummary, setFaReliefSummary] = useState([]);
  const [faReliefCompareSummary, setFaReliefCompareSummary] = useState([]);

  // Stuff score
  const [faStarterStuff, setFaStarterStuff] = useState(null);
  const [faReliefStuff, setFaReliefStuff] = useState(null);
  const [mlbStarterStuff, setMlbStarterStuff] = useState(null);
  const [mlbReliefStuff, setMlbReliefStuff] = useState(null);

  useEffect(() => {
    async function loadLists() {
      try {
        const [fa, far] = await Promise.all([
          fetch(`${API_BASE}/free_agents`).then((r) => r.json()),
          fetch(`${API_BASE}/free_agents/relief`).then((r) => r.json()),
        ]);
        setFreeAgentPitchers(fa);
        setFreeAgentReliefPitchers(far);
      } catch (err) {
        console.error(err);
        setError("Failed to load free-agent lists from backend.");
      }
    }
    loadLists();
  }, []);

  // Team tab: load pitchers when team/role changes
  useEffect(() => {
    if (!teamTabTeam) {
      setTeamTabPitchers([]);
      return;
    }
    async function load() {
      try {
        setError("");
        const res = await fetch(
          `${API_BASE}/teams/${teamTabTeam}/pitchers?role=${teamTabRole}`
        );
        if (!res.ok) throw new Error(`team pitchers ${res.status}`);
        setTeamTabPitchers(await res.json());
      } catch (err) {
        console.error(err);
        setError("Failed to load team pitchers.");
        setTeamTabPitchers([]);
      }
    }
    load();
  }, [teamTabTeam, teamTabRole]);

  // Team tab: load comparison team pitchers
  useEffect(() => {
    const role =
      teamTabCompareType === "team_starter"
        ? "starter"
        : teamTabCompareType === "team_reliever"
          ? "reliever"
          : null;
    if (!role || !teamTabCompareTeam) {
      setTeamTabCompareTeamPitchers([]);
      return;
    }
    async function load() {
      try {
        const res = await fetch(
          `${API_BASE}/teams/${teamTabCompareTeam}/pitchers?role=${role}`
        );
        setTeamTabCompareTeamPitchers(res.ok ? await res.json() : []);
      } catch {
        setTeamTabCompareTeamPitchers([]);
      }
    }
    load();
  }, [teamTabCompareType, teamTabCompareTeam]);

  // Team tab summaries
  useEffect(() => {
    async function load() {
      try {
        setError("");
        setTeamTabSummary(
          teamTabPitcherId ? await fetchSummaryFor(teamTabPitcherId) : []
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load pitcher summary.");
        setTeamTabSummary([]);
      }
    }
    if (activeTab === "team") load();
  }, [activeTab, teamTabPitcherId]);

  useEffect(() => {
    async function load() {
      try {
        setTeamTabCompareSummary(
          teamTabCompareId ? await fetchSummaryFor(teamTabCompareId) : []
        );
      } catch (err) {
        console.error(err);
        setTeamTabCompareSummary([]);
      }
    }
    if (activeTab === "team") load();
  }, [activeTab, teamTabCompareId]);

  // FA starter team list (role depends on comparison type)
  useEffect(() => {
    if (!faStarterTeam) {
      setFaStarterTeamPitchers([]);
      return;
    }
    const role =
      faStarterCompareType === "teamReliever" ? "reliever" : "starter";
    async function load() {
      try {
        const res = await fetch(
          `${API_BASE}/teams/${faStarterTeam}/pitchers?role=${role}`
        );
        setFaStarterTeamPitchers(res.ok ? await res.json() : []);
      } catch {
        setFaStarterTeamPitchers([]);
      }
    }
    load();
  }, [faStarterTeam, faStarterCompareType]);

  useEffect(() => {
    async function load() {
      try {
        setError("");
        setFaStarterSummary(
          faStarterId ? await fetchSummaryFor(faStarterId) : []
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load free-agent summary.");
        setFaStarterSummary([]);
      }
    }
    if (activeTab === "free_agents") load();
  }, [activeTab, faStarterId]);

  useEffect(() => {
    async function load() {
      let id = "";
      if (
        faStarterCompareType === "freeAgent" ||
        faStarterCompareType === "freeAgentReliever"
      ) {
        id = faStarterSecondId;
      }
      if (
        faStarterCompareType === "teamStarter" ||
        faStarterCompareType === "teamReliever"
      ) {
        id = faStarterTeamPitcherId;
      }
      try {
        setFaStarterCompareSummary(id ? await fetchSummaryFor(id) : []);
      } catch {
        setFaStarterCompareSummary([]);
      }
    }
    if (activeTab === "free_agents") load();
  }, [
    activeTab,
    faStarterCompareType,
    faStarterSecondId,
    faStarterTeamPitcherId,
  ]);

  // FA relief team list (role depends on comparison type)
  useEffect(() => {
    if (!faReliefTeam) {
      setFaReliefTeamPitchers([]);
      return;
    }
    const role =
      faReliefCompareType === "teamStarter" ? "starter" : "reliever";
    async function load() {
      try {
        const res = await fetch(
          `${API_BASE}/teams/${faReliefTeam}/pitchers?role=${role}`
        );
        setFaReliefTeamPitchers(res.ok ? await res.json() : []);
      } catch {
        setFaReliefTeamPitchers([]);
      }
    }
    load();
  }, [faReliefTeam, faReliefCompareType]);

  useEffect(() => {
    async function load() {
      try {
        setError("");
        setFaReliefSummary(
          faReliefId ? await fetchSummaryFor(faReliefId) : []
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load free-agent relief summary.");
        setFaReliefSummary([]);
      }
    }
    if (activeTab === "free_agents_relief") load();
  }, [activeTab, faReliefId]);

  useEffect(() => {
    async function load() {
      let id = "";
      if (
        faReliefCompareType === "freeAgent" ||
        faReliefCompareType === "freeAgentStarter"
      ) {
        id = faReliefSecondId;
      }
      if (
        faReliefCompareType === "teamReliever" ||
        faReliefCompareType === "teamStarter"
      ) {
        id = faReliefTeamPitcherId;
      }
      try {
        setFaReliefCompareSummary(id ? await fetchSummaryFor(id) : []);
      } catch {
        setFaReliefCompareSummary([]);
      }
    }
    if (activeTab === "free_agents_relief") load();
  }, [
    activeTab,
    faReliefCompareType,
    faReliefSecondId,
    faReliefTeamPitcherId,
  ]);

  // Stuff score boards
  useEffect(() => {
    if (activeTab !== "stuff_score") return;
    async function load() {
      try {
        setError("");
        const [a, b, c, d] = await Promise.all([
          fetch(`${API_BASE}/free_agents/stuff_score`).then((r) => r.json()),
          fetch(`${API_BASE}/free_agents/relief/stuff_score`).then((r) =>
            r.json()
          ),
          fetch(`${API_BASE}/mlb/starters/stuff_score`).then((r) => r.json()),
          fetch(`${API_BASE}/mlb/relievers/stuff_score`).then((r) => r.json()),
        ]);
        setFaStarterStuff(a);
        setFaReliefStuff(b);
        setMlbStarterStuff(c);
        setMlbReliefStuff(d);
      } catch (err) {
        console.error(err);
        setError("Failed to load Stuff Score leaderboards.");
      }
    }
    load();
  }, [activeTab]);

  return (
    <div className="App">
      <header className="hero">
        <h1>PitcherIQ</h1>
        <p className="tagline">MLB Pitcher Comparison &amp; Arsenal Analysis</p>
        <p className="subtitle">
          Compare pitch arsenals, movement profiles, locations, and key metrics
          across MLB pitchers and the 2025 free-agent class.
        </p>
      </header>

      <div className="layout">
        <nav className="tabs">
          <button
            className={`tab ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            About
          </button>
          <button
            className={`tab ${activeTab === "team" ? "active" : ""}`}
            onClick={() => setActiveTab("team")}
          >
            Team Pitchers
          </button>
          <button
            className={`tab ${activeTab === "free_agents" ? "active" : ""}`}
            onClick={() => setActiveTab("free_agents")}
          >
            FA Starters
          </button>
          <button
            className={`tab ${activeTab === "free_agents_relief" ? "active" : ""}`}
            onClick={() => setActiveTab("free_agents_relief")}
          >
            FA Relievers
          </button>
          <button
            className={`tab ${activeTab === "stuff_score" ? "active" : ""}`}
            onClick={() => setActiveTab("stuff_score")}
          >
            Stuff Score
          </button>
        </nav>

        {activeTab === "about" && <AboutPageTab />}

        {activeTab === "team" && (
          <TeamPitchersTab
            selectedTeam={teamTabTeam}
            setSelectedTeam={setTeamTabTeam}
            selectedRole={teamTabRole}
            setSelectedRole={setTeamTabRole}
            teamPitchers={teamTabPitchers}
            selectedPitcherId={teamTabPitcherId}
            setSelectedPitcherId={setTeamTabPitcherId}
            comparisonType={teamTabCompareType}
            setComparisonType={setTeamTabCompareType}
            compareTeam={teamTabCompareTeam}
            setCompareTeam={setTeamTabCompareTeam}
            compareTeamPitchers={teamTabCompareTeamPitchers}
            selectedCompareId={teamTabCompareId}
            setSelectedCompareId={setTeamTabCompareId}
            summary={teamTabSummary}
            comparisonSummary={teamTabCompareSummary}
            error={error}
          />
        )}

        {activeTab === "free_agents" && (
          <FreeAgentsTab
            freeAgentPitchers={freeAgentPitchers}
            freeAgentReliefPitchers={freeAgentReliefPitchers}
            selectedFreeAgentId={faStarterId}
            setSelectedFreeAgentId={setFaStarterId}
            comparisonType={faStarterCompareType}
            setComparisonType={setFaStarterCompareType}
            selectedSecondFreeAgentId={faStarterSecondId}
            setSelectedSecondFreeAgentId={setFaStarterSecondId}
            selectedTeam={faStarterTeam}
            setSelectedTeam={setFaStarterTeam}
            teamPitchers={faStarterTeamPitchers}
            selectedTeamPitcherId={faStarterTeamPitcherId}
            setSelectedTeamPitcherId={setFaStarterTeamPitcherId}
            summary={faStarterSummary}
            comparisonSummary={faStarterCompareSummary}
            error={error}
          />
        )}

        {activeTab === "free_agents_relief" && (
          <FreeAgentReliefPitchersTab
            freeAgentReliefPitchers={freeAgentReliefPitchers}
            freeAgentPitchers={freeAgentPitchers}
            selectedFreeAgentReliefId={faReliefId}
            setSelectedFreeAgentReliefId={setFaReliefId}
            comparisonTypeRelief={faReliefCompareType}
            setComparisonTypeRelief={setFaReliefCompareType}
            selectedSecondFreeAgentReliefId={faReliefSecondId}
            setSelectedSecondFreeAgentReliefId={setFaReliefSecondId}
            selectedTeam={faReliefTeam}
            setSelectedTeam={setFaReliefTeam}
            teamPitchers={faReliefTeamPitchers}
            selectedTeamPitcherId={faReliefTeamPitcherId}
            setSelectedTeamPitcherId={setFaReliefTeamPitcherId}
            summary={faReliefSummary}
            comparisonSummary={faReliefCompareSummary}
            error={error}
          />
        )}

        {activeTab === "stuff_score" && (
          <StuffScoreTab
            stuffScoreData={faStarterStuff}
            freeAgentReliefStuffScoreData={faReliefStuff}
            mlbStartersStuffScoreData={mlbStarterStuff}
            mlbRelieversStuffScoreData={mlbReliefStuff}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
