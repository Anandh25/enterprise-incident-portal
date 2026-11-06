import "./App.css";
import axios from "axios";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import AuthPage from "./AuthPage";

type Comment = {
  _id: string;
  message: string;
  author: {
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
};

type AuditLog = {
  _id: string;
  action: "created" | "status_updated" | "assigned" | "comment_added";
  details: string;
  performedBy: {
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
};

type DashboardSummary = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  overdue: number;
};

type Incident = {
  _id: string;
  title: string;
  description: string;
  category: "hardware" | "software" | "network" | "access" | "other";
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "pending" | "resolved" | "closed";
  createdAt: string;
  dueDate?: string;
  createdBy?: string | { name: string; email: string };
  assignedTo?: string | { name: string; email: string };
};

type CurrentUser = {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "support_agent" | "employee";
};

function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [assignedIncidents, setAssignedIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showAllIncidents, setShowAllIncidents] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activePage, setActivePage] = useState<
    "dashboard" | "incidents" | "assignments" | "settings"
  >("dashboard");
  const [category, setCategory] = useState<
    "hardware" | "software" | "network" | "access" | "other"
  >("hardware");
  const [priority, setPriority] = useState<
    "critical" | "high" | "medium" | "low"
  >("medium");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token")),
  );
  const handleIncidentClick = async (incidentId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/incidents/${incidentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log("Incident details:", response.data.data);
      setSelectedIncident(response.data.data);
      const commentsResponse = await axios.get(
        `http://localhost:5000/api/incidents/${incidentId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setComments(commentsResponse.data.data);
      const auditResponse = await axios.get(
        `http://localhost:5000/api/incidents/${incidentId}/audit-logs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAuditLogs(auditResponse.data.data);
    } catch {
      setError("Unable to load incident details.");
    }
  };

  const handleAddComment = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token || !selectedIncident || !newComment.trim()) {
        return;
      }

      await axios.post(
        `http://localhost:5000/api/incidents/${selectedIncident._id}/comments`,
        {
          message: newComment.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const response = await axios.get(
        `http://localhost:5000/api/incidents/${selectedIncident._id}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setComments(response.data.data);
      setNewComment("");
      toast.success("Comment added successfully!");
    } catch {
      setError("Unable to add comment.");
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token || !selectedIncident) {
        toast.error("Unable to update incident status.");
        return;
      }

      const response = await axios.patch(
        `http://localhost:5000/api/incidents/${selectedIncident._id}`,
        { status: selectedIncident.status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSelectedIncident(response.data.data);

      const auditResponse = await axios.get(
        `http://localhost:5000/api/incidents/${selectedIncident._id}/audit-logs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAuditLogs(auditResponse.data.data);

      await fetchDashboard();

      toast.success("Incident status updated successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to update incident status.",
        );
      } else {
        toast.error("Something went wrong while updating status.");
      }
    }
  };

  const handleCreateIncident = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in again.");
        toast.error("Please log in again.");
        return;
      }

      await axios.post(
        "http://localhost:5000/api/incidents",
        {
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTitle("");
      setDescription("");
      setCategory("hardware");
      setPriority("medium");
      setShowIncidentForm(false);

      // Refresh dashboard data after creating the incident.
      const [summaryResponse, incidentsResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/incidents/dashboard/summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/incidents?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setSummary(summaryResponse.data.data);
      setIncidents(incidentsResponse.data.data);

      toast.success("Incident created successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to create incident.");
      } else {
        setError("Something went wrong while creating the incident.");
      }

      toast.error("Failed to create incident.");
    }
  };

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const userResponse = await axios.get(
        "http://localhost:5000/api/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCurrentUser(userResponse.data.data);

      const response = await axios.get(
        "http://localhost:5000/api/incidents/dashboard/summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSummary(response.data.data);

      const incidentsResponse = await axios.get(
        "http://localhost:5000/api/incidents?limit=100",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (
        userResponse.data.data.role === "support_agent" ||
        userResponse.data.data.role === "admin"
      ) {
        const assignmentsResponse = await axios.get(
          "http://localhost:5000/api/incidents/my-assignments",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setAssignedIncidents(assignmentsResponse.data.data);
      }

      setIncidents(incidentsResponse.data.data);
    } catch {
      setError("Unable to load some dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{ duration: 3000 }}
        />
        <AuthPage
          onLoginSuccess={() => {
            setError("");
            setIsAuthenticated(true);
          }}
        />
      </>
    );
  }

  return (
    <div className="app-layout">
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
        }}
      />
      <aside className="sidebar">
        <h2 className="brand">
          Incident<span>Portal</span>
        </h2>

        <p className="menu-label">WORKSPACE</p>
        <nav>
          <button
            className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={`nav-link ${activePage === "incidents" ? "active" : ""}`}
            onClick={() => setActivePage("incidents")}
          >
            All Incidents
          </button>

          {(currentUser?.role === "support_agent" ||
            currentUser?.role === "admin") && (
            <button
              className={`nav-link ${activePage === "assignments" ? "active" : ""}`}
              onClick={() => setActivePage("assignments")}
            >
              My Assignments
            </button>
          )}
        </nav>

        <div className="sidebar-bottom">
          <p className="menu-label">SYSTEM</p>
          <a className="nav-link" href="#settings">
            Settings
          </a>
          <div className="profile">
            <div className="avatar">TU</div>
            <div>
              <strong>{currentUser?.name ?? "Loading user..."}</strong>
              <small>{currentUser?.role?.replace("_", " ") ?? ""}</small>
            </div>
          </div>
          <button
            className="secondary-button"
            onClick={() => {
              localStorage.removeItem("token");
              setIsAuthenticated(false);
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">WORKSPACE / {activePage.toUpperCase()}</p>

            <h1>
              {activePage === "dashboard"
                ? "Dashboard"
                : activePage === "incidents"
                  ? "All Incidents"
                  : activePage === "assignments"
                    ? "My Assignments"
                    : "Settings"}
            </h1>

            <p className="subtitle">
              {activePage === "dashboard"
                ? "Monitor and manage service incidents."
                : activePage === "incidents"
                  ? "View and manage all reported incidents."
                  : activePage === "assignments"
                    ? "Track incidents assigned to you."
                    : "Manage your account settings."}
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => setShowIncidentForm(true)}
          >
            + New Incident
          </button>
        </header>
        {selectedIncident && (
          <section className="content-card">
            <div className="section-heading">
              <div>
                <h2>{selectedIncident.title}</h2>
                <p>Incident Details</p>
              </div>

              <button
                className="secondary-button"
                onClick={() => setSelectedIncident(null)}
              >
                Back
              </button>
            </div>

            <p>{selectedIncident.description}</p>

            <p>Priority: {selectedIncident.priority}</p>
            <p>Status: {selectedIncident.status.replace("_", " ")}</p>
            {(currentUser?.role === "admin" ||
              currentUser?.role === "support_agent") && (
              <div>
                <label htmlFor="incident-status">Update Status:</label>

                <select
                  id="incident-status"
                  value={selectedIncident.status}
                  onChange={(e) =>
                    setSelectedIncident({
                      ...selectedIncident,
                      status: e.target.value as Incident["status"],
                    })
                  }
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button type="button" onClick={handleUpdateStatus}>
                  Save Status
                </button>
              </div>
            )}
            <p>Category: {selectedIncident.category}</p>
            <p>
              Created: {new Date(selectedIncident.createdAt).toLocaleString()}
            </p>

            <p>
              Created By:{" "}
              {typeof selectedIncident.createdBy === "object"
                ? selectedIncident.createdBy?.name
                : selectedIncident.createdBy || "Not available"}
            </p>

            <p>
              Assigned To:{" "}
              {typeof selectedIncident.assignedTo === "object"
                ? selectedIncident.assignedTo?.name
                : selectedIncident.assignedTo || "Unassigned"}
            </p>
            <div>
              <h3>Comments</h3>

              {comments.length === 0 ? (
                <p>No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id}>
                    <strong>{comment.author.name}</strong>
                    <p>{comment.message}</p>
                    <small>
                      {new Date(comment.createdAt).toLocaleString()}
                    </small>
                  </div>
                ))
              )}
              <textarea
                placeholder="Write your comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                className="primary-button"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                Post Comment
              </button>
            </div>
            {/* Audit History Section */}
            <div>
              <h3>Activity History</h3>

              {auditLogs.length === 0 ? (
                <p>No activity recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log._id}>
                    <strong>{log.performedBy.name}</strong>
                    <p>{log.details}</p>
                    <small>
                      {log.action.replace("_", " ")} ·{" "}
                      {new Date(log.createdAt).toLocaleString()}
                    </small>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
        {activePage === "dashboard" && (
          <>
            {showIncidentForm && (
              <section className="content-card">
                <div className="section-heading">
                  <div>
                    <h2>Create New Incident</h2>
                    <p>Report a service issue for the support team.</p>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => setShowIncidentForm(false)}
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCreateIncident}>
                  <label>
                    Incident Title
                    <input
                      type="text"
                      placeholder="e.g. Laptop not starting"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Description
                    <textarea
                      placeholder="Describe the issue..."
                      rows={4}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Category
                    <select
                      value={category}
                      onChange={(event) =>
                        setCategory(
                          event.target.value as
                            | "hardware"
                            | "software"
                            | "network"
                            | "access"
                            | "other",
                        )
                      }
                    >
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                      <option value="network">Network</option>
                      <option value="access">Access</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label>
                    Priority
                    <select
                      value={priority}
                      onChange={(event) =>
                        setPriority(
                          event.target.value as
                            | "critical"
                            | "high"
                            | "medium"
                            | "low",
                        )
                      }
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </label>

                  <button className="primary-button" type="submit">
                    Create Incident
                  </button>
                </form>
              </section>
            )}
            <section className="welcome-banner">
              <div>
                <p className="eyebrow">INCIDENT MANAGEMENT</p>
                <h2>Good to see you, {currentUser?.name ?? "there"}.</h2>
                <p>Here’s an overview of your service desk today.</p>
              </div>
              <div className="banner-icon">✦</div>
            </section>

            {loading && <p>Loading dashboard...</p>}

            {!loading && error && <p role="alert">{error}</p>}

            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-heading">
                  <span>Total Incidents</span>
                  <span className="stat-icon blue">▤</span>
                </div>
                <h2>{summary?.total ?? "—"}</h2>
                <p>All recorded incidents</p>
              </article>

              <article className="stat-card">
                <div className="stat-heading">
                  <span>Open</span>
                  <span className="stat-icon orange">◷</span>
                </div>
                <h2>{summary?.open ?? "—"}</h2>
                <p>Awaiting action</p>
              </article>

              <article className="stat-card">
                <div className="stat-heading">
                  <span>In Progress</span>
                  <span className="stat-icon purple">↻</span>
                </div>
                <h2>{summary?.inProgress ?? "—"}</h2>
                <p>Currently being handled</p>
              </article>

              <article className="stat-card">
                <div className="stat-heading">
                  <span>Resolved</span>
                  <span className="stat-icon green">✓</span>
                </div>
                <h2>{summary?.resolved ?? "—"}</h2>
                <p>Successfully resolved</p>
              </article>

              <article className="stat-card">
                <div className="stat-heading">
                  <span>Overdue</span>
                  <span className="stat-icon orange">!</span>
                </div>
                <h2>{summary?.overdue ?? "—"}</h2>
                <p>Past SLA deadline</p>
              </article>
            </section>

            <section className="content-card" id="incidents">
              <div className="section-heading">
                <div>
                  <h2>Recent Incidents</h2>
                  <p>Track the latest activity in your service desk.</p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => setShowAllIncidents((prev) => !prev)}
                >
                  {showAllIncidents ? "Show less" : "View all"}
                </button>
              </div>

              {incidents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">▤</div>
                  <h3>No incidents found</h3>
                  <p>New incidents will appear here.</p>
                </div>
              ) : (
                <div className="incident-table-wrapper">
                  <table className="incident-table">
                    <thead>
                      <tr>
                        <th>Incident</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(showAllIncidents
                        ? incidents
                        : incidents.slice(0, 5)
                      ).map((incident) => (
                        <tr
                          key={incident._id}
                          onClick={() => handleIncidentClick(incident._id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <strong>{incident.title}</strong>
                          </td>
                          <td>
                            <span
                              className={`priority-badge ${incident.priority}`}
                            >
                              {incident.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${incident.status}`}>
                              {incident.status.replace("_", " ")}
                            </span>
                          </td>
                          <td>
                            {new Date(incident.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {activePage === "incidents" && (
          <section className="content-card">
            <div className="section-heading">
              <div>
                <h2>All Incidents</h2>
                <p>View and track all reported service incidents.</p>
              </div>
              <span>{incidents.length} incidents</span>
            </div>

            {incidents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">▤</div>
                <h3>No incidents found</h3>
                <p>New incidents will appear here.</p>
              </div>
            ) : (
              <div className="incident-table-wrapper">
                <table className="incident-table">
                  <thead>
                    <tr>
                      <th>Incident</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>

                  <tbody>
                    {incidents.map((incident) => (
                      <tr
                        key={incident._id}
                        onClick={() => handleIncidentClick(incident._id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <strong>{incident.title}</strong>
                        </td>
                        <td>
                          <span
                            className={`priority-badge ${incident.priority}`}
                          >
                            {incident.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${incident.status}`}>
                            {incident.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activePage === "assignments" && (
          <section className="content-card">
            <div className="section-heading">
              <div>
                <h2>My Assigned Incidents</h2>
                <p>Incidents currently assigned to you.</p>
              </div>
              <span>{assignedIncidents.length} incidents</span>
            </div>

            {assignedIncidents.length === 0 ? (
              <div className="empty-state">
                <h3>No assignments found</h3>
                <p>Incidents assigned to you will appear here.</p>
              </div>
            ) : (
              <div className="incident-table-wrapper">
                <table className="incident-table">
                  <thead>
                    <tr>
                      <th>Incident</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>

                  <tbody>
                    {assignedIncidents.map((incident) => (
                      <tr key={incident._id}>
                        <td>
                          <strong>{incident.title}</strong>
                        </td>
                        <td>
                          <span
                            className={`priority-badge ${incident.priority}`}
                          >
                            {incident.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${incident.status}`}>
                            {incident.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
