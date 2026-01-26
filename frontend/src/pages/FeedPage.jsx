import { useEffect, useMemo, useState } from "react";
import FeedList from "../components/FeedList.jsx";
import { mockFeedItems } from "../data/mockFeedItems.js";

function simulateFetch({ mode }) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (mode === "error") return reject(new Error("Failed to load feed."));
      if (mode === "empty") return resolve([]);
      return resolve(mockFeedItems);
    }, 500);
  });
}

export default function FeedPage() {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [items, setItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const [filterType, setFilterType] = useState("all");
  const [demoMode, setDemoMode] = useState("normal"); // normal | empty | error

  useEffect(() => {
    let isAlive = true;

    async function load() {
      setStatus("loading");
      setErrorMsg("");
      try {
        const data = await simulateFetch({ mode: demoMode });
        if (!isAlive) return;
        setItems(data);
        setStatus("ready");
      } catch (err) {
        if (!isAlive) return;
        setErrorMsg(err?.message || "Unknown error");
        setStatus("error");
      }
    }

    load();
    return () => {
      isAlive = false;
    };
  }, [demoMode]);

  const visibleItems = useMemo(() => {
    if (filterType === "all") return items;
    return items.filter((i) => i.type === filterType);
  }, [items, filterType]);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Animal Activity Feed</h1>
          <p className="muted">Latest updates from shelters and pets.</p>
        </div>

        <div className="controls">
          <label className="control">
            <span className="control-label">Type</span>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All</option>
              <option value="new_pet">New pet</option>
              <option value="status_change">Status change</option>
              <option value="adoption_event">Adoption event</option>
              <option value="photo_added">Photo added</option>
              <option value="update">Update</option>
            </select>
          </label>

          <label className="control">
            <span className="control-label">Demo</span>
            <select value={demoMode} onChange={(e) => setDemoMode(e.target.value)}>
              <option value="normal">Normal</option>
              <option value="empty">Empty</option>
              <option value="error">Error</option>
            </select>
          </label>
        </div>
      </div>

      {status === "loading" && (
        <div className="stack">
          <div className="skeleton card" />
          <div className="skeleton card" />
          <div className="skeleton card" />
        </div>
      )}

      {status === "error" && (
        <div className="card">
          <h2>Could not load feed</h2>
          <p className="muted">{errorMsg}</p>
          <button className="btn" onClick={() => setDemoMode("normal")}>
            Retry
          </button>
        </div>
      )}

      {status === "ready" && visibleItems.length === 0 && (
        <div className="card">
          <h2>No activity yet</h2>
          <p className="muted">
            Try switching the filter to “All” or check back later.
          </p>
        </div>
      )}

      {status === "ready" && visibleItems.length > 0 && <FeedList items={visibleItems} />}
    </div>
  );
}
