import "./App.css";
import axios from "axios";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import AuthPage from "./AuthPage";

type Comment = {
  _id: string;
  message: string;
  originalMessage?: string;
  author: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  editHistory?: {
    message: string;
    editedBy: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    editedAt: string;
  }[];
};

type AuditLog = {
  _id: string;
  action:
    | "created"
    | "status_updated"
    | "assigned"
    | "comment_added"
    | "comment_edited";
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
  const [overdueIncidents, setOverdueIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentMessage, setEditedCommentMessage] = useState("");
  const [expandedCommentHistory, setExpandedCommentHistory] = useState<
    string[]
  >([]);
  const [showAllIncidents, setShowAllIncidents] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activePage, setActivePage] = useState<
    "dashboard" | "incidents" | "assignments" | "overdue" | "settings"
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
  const clearUserSessionData = () => {
    setSummary(null);
    setError("");
    setLoading(true);

    setIncidents([]);
    setAssignedIncidents([]);

    setSelectedIncident(null);
    setComments([]);
    setAuditLogs([]);
    setNewComment("");
    setEditingCommentId(null);
    setEditedCommentMessage("");
    setExpandedCommentHistory([]);

    setCurrentUser(null);

    setActivePage("dashboard");
    setShowAllIncidents(false);
    setShowIncidentForm(false);
  };
  const handleIncidentClick = async (incidentId: string) => {
    setEditingCommentId(null);
    setEditedCommentMessage("");
    setExpandedCommentHistory([]);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://enterprise-incident-portal.onrender.com/api/incidents/${incidentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log("Incident details:", response.data.data);
      setSelectedIncident(response.data.data);
      const commentsResponse = await axios.get(
        `https://enterprise-incident-portal.onrender.com/api/incidents/${incidentId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setComments(commentsResponse.data.data);
      const auditResponse = await axios.get(
        `https://enterprise-incident-portal.onrender.com/api/incidents/${incidentId}/audit-logs`,
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
        `https://enterprise-incident-portal.onrender.com/api/incidents/${selectedIncident._id}/comments`,
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
        `https://enterprise-incident-portal.onrender.com/api/incidents/${selectedIncident._id}/comments`,
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

  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditedCommentMessage(comment.message);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditedCommentMessage("");
  };

  const handleToggleCommentHistory = (commentId: string) => {
    setExpandedCommentHistory((previous) =>
      previous.includes(commentId)
        ? previous.filter((id) => id !== commentId)
        : [...previous, commentId],
    );
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    try {
      const token = localStorage.getItem("token");

      if (!token || !selectedIncident || !editedCommentMessage.trim()) {
        toast.error("Comment message is required.");
        return;
      }

      await axios.patch(
        `https://enterprise-incident-portal.onrender.com/api/incidents/${selectedIncident._id}/comments/${commentId}`,
        { message: editedCommentMessage.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const [commentsResponse, auditResponse] = await Promise.all([
        axios.get(
          `https://enterprise-incident-portal.onrender.com/api/incidents/${selectedIncident._id}/comments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
        axios.get(
          `https://enterprise-incident-portal.onrender.com/api/incidents/${selectedIncident._id}/audit-logs`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      ]);

      setComments(commentsResponse.data.data);
      setAuditLogs(auditResponse.data.data);
      setEditingCommentId(null);
      setEditedCommentMessage("");
      toast.success("Comment updated successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Unable to update comment.",
        );
      } else {
        toast.error("Something went wrong while updating the comment.");
      }
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
        `https://enterprise-incident-portal.onrender.com/api/incidents/${selectedIncident._id}`,
        { status: selectedIncident.status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSelectedIncident(response.data.data);

      const auditResponse = await axios.get(
        `https://enterprise-incident-portal.onrender.com/api/incidents/${selectedIncident._id}/audit-logs`,
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
        "https://enterprise-incident-portal.onrender.com/api/incidents",
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
        axios.get(
          "https://enterprise-incident-portal.onrender.com/api/incidents/dashboard/summary",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
        axios.get(
          "https://enterprise-incident-portal.onrender.com/api/incidents?limit=100",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
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
        "https://enterprise-incident-portal.onrender.com/api/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCurrentUser(userResponse.data.data);

      const response = await axios.get(
        "https://enterprise-incident-portal.onrender.com/api/incidents/dashboard/summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSummary(response.data.data);
      const overdueResponse = await axios.get(
        "https://enterprise-incident-portal.onrender.com/api/incidents/overdue",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setOverdueIncidents(overdueResponse.data.data);
      const incidentsResponse = await axios.get(
        "https://enterprise-incident-portal.onrender.com/api/incidents?limit=100",
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
          "https://enterprise-incident-portal.onrender.com/api/incidents/my-assignments",
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
            clearUserSessionData();
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

          <button
            className={`nav-link ${activePage === "overdue" ? "active" : ""}`}
            onClick={() => {
              setSelectedIncident(null);
              setActivePage("overdue");
            }}
          >
            Overdue Incidents
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
              clearUserSessionData();
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
                    : activePage === "overdue"
                      ? "Overdue Incidents"
                      : "Settings"}
            </h1>

            <p className="subtitle">
              {activePage === "dashboard"
                ? "Monitor and manage service incidents."
                : activePage === "incidents"
                  ? "View and manage all reported incidents."
                  : activePage === "assignments"
                    ? "Track incidents assigned to you."
                    : activePage === "overdue"
                      ? "Track incidents that have exceeded their SLA deadline."
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
          <section className="content-card incident-overview">
            {/* Incident Header */}
            <div className="incident-overview-header">
              <div>
                <p className="eyebrow">INCIDENT DETAILS</p>
                <h2>{selectedIncident.title}</h2>
                <p>Incident ID: {selectedIncident._id}</p>
              </div>

              <button
                className="secondary-button"
                onClick={() => setSelectedIncident(null)}
              >
                Back to Incidents
              </button>
            </div>

            {/* Incident Metadata */}
            <div className="incident-meta-grid">
              <div className="incident-meta-item">
                <span>Priority</span>
                <strong>
                  <span
                    className={`priority-badge ${selectedIncident.priority}`}
                  >
                    {selectedIncident.priority}
                  </span>
                </strong>
              </div>

              <div className="incident-meta-item">
                <span>Status</span>
                <strong>
                  <span className={`status-badge ${selectedIncident.status}`}>
                    {selectedIncident.status.replace("_", " ")}
                  </span>
                </strong>
              </div>

              <div className="incident-meta-item">
                <span>Category</span>
                <strong>{selectedIncident.category}</strong>
              </div>

              <div className="incident-meta-item">
                <span>Created On</span>
                <strong>
                  {new Date(selectedIncident.createdAt).toLocaleDateString()}
                </strong>
              </div>

              <div className="incident-meta-item">
                <span>Reported By</span>
                <strong>
                  {typeof selectedIncident.createdBy === "object"
                    ? selectedIncident.createdBy?.name
                    : selectedIncident.createdBy || "Not available"}
                </strong>
              </div>

              <div className="incident-meta-item">
                <span>Assigned To</span>
                <strong>
                  {typeof selectedIncident.assignedTo === "object"
                    ? selectedIncident.assignedTo?.name
                    : selectedIncident.assignedTo || "Unassigned"}
                </strong>
              </div>

              <div className="incident-meta-item">
                <span>SLA Due Date</span>
                <strong>
                  {selectedIncident.dueDate
                    ? new Date(selectedIncident.dueDate).toLocaleString()
                    : "Not available"}
                </strong>
              </div>
            </div>

            {/* Description */}
            <div className="incident-description">
              <h3>Description</h3>
              <p>{selectedIncident.description}</p>
            </div>

            {/* Status Management */}
            {(currentUser?.role === "admin" ||
              currentUser?.role === "support_agent") && (
              <div className="incident-description">
                <h3>Manage Incident Status</h3>

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

            {/* Comments */}
            <div className="incident-description">
              <h3>Comments ({comments.length})</h3>

              {comments.length === 0 ? (
                <p>No comments yet.</p>
              ) : (
                comments.map((comment) => {
                  const isCommentAuthor =
                    comment.author._id === currentUser?.userId;
                  const hasEditHistory = Boolean(comment.editHistory?.length);
                  const isHistoryExpanded = expandedCommentHistory.includes(
                    comment._id,
                  );
                  const isEditing = editingCommentId === comment._id;

                  return (
                    <div className="comment-item" key={comment._id}>
                      <div className="comment-header">
                        <strong>{comment.author.name}</strong>
                        <small>
                          {new Date(comment.createdAt).toLocaleString()}
                        </small>
                      </div>

                      {isEditing ? (
                        <div className="comment-edit-form">
                          <textarea
                            value={editedCommentMessage}
                            onChange={(event) =>
                              setEditedCommentMessage(event.target.value)
                            }
                            rows={3}
                            autoFocus
                          />
                          <div className="comment-edit-actions">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={handleCancelEditComment}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => handleSaveCommentEdit(comment._id)}
                              disabled={!editedCommentMessage.trim()}
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p>{comment.message}</p>
                      )}

                      <div className="comment-actions">
                        {isCommentAuthor && !isEditing && (
                          <button
                            type="button"
                            className="comment-action-button"
                            onClick={() => handleStartEditComment(comment)}
                          >
                            Edit
                          </button>
                        )}

                        {hasEditHistory && (
                          <button
                            type="button"
                            className="comment-action-button"
                            onClick={() =>
                              handleToggleCommentHistory(comment._id)
                            }
                          >
                            {isHistoryExpanded
                              ? "Hide history"
                              : `View history (${comment.editHistory?.length ?? 0})`}
                          </button>
                        )}
                      </div>

                      {hasEditHistory && isHistoryExpanded && (
                        <div className="comment-history">
                          <h4>Comment History</h4>

                          <div className="comment-history-item">
                            <div className="comment-history-header">
                              <strong>Original</strong>
                              <span className="comment-history-badge original">
                                Original
                              </span>
                            </div>
                            <p>{comment.originalMessage || comment.message}</p>
                            <small>
                              Posted by {comment.author.name} ·{" "}
                              {new Date(comment.createdAt).toLocaleString()}
                            </small>
                          </div>

                          {comment.editHistory?.map((edit, index) => (
                            <div
                              className="comment-history-item"
                              key={`${comment._id}-${index}`}
                            >
                              <div className="comment-history-header">
                                <strong>Edited</strong>
                                <span className="comment-history-badge edited">
                                  Edited
                                </span>
                              </div>
                              <p>{edit.message}</p>
                              <small>
                                Edited by{" "}
                                {edit.editedBy?.name ?? "Unknown user"}
                                {" · "}
                                {new Date(edit.editedAt).toLocaleString()}
                              </small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <div className="comment-form">
                <textarea
                  placeholder="Write a comment or share an update..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />

                <div className="comment-form-footer">
                  <span>Keep your team informed with updates.</span>

                  <button
                    className="primary-button"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>

            {/* Activity History */}
            <div className="incident-description">
              <h3>Activity History ({auditLogs.length})</h3>

              {auditLogs.length === 0 ? (
                <p>No activity recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div className="activity-item" key={log._id}>
                    <div className="activity-dot"></div>

                    <div className="activity-content">
                      <div className="activity-header">
                        <strong>{log.performedBy.name}</strong>
                        <small>
                          {new Date(log.createdAt).toLocaleString()}
                        </small>
                      </div>

                      <p>{log.details}</p>

                      <span className="activity-action">
                        {log.action.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {!selectedIncident && activePage === "dashboard" && (
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

        {!selectedIncident && activePage === "incidents" && (
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
        {activePage === "overdue" && (
          <section className="content-card">
            <div className="section-heading">
              <div>
                <h2>Overdue Incidents</h2>
                <p>Track incidents that have exceeded their SLA deadline.</p>
              </div>
              <span>{overdueIncidents.length} overdue</span>
            </div>

            {overdueIncidents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <h3>No overdue incidents</h3>
                <p>
                  Great! There are no overdue incidents assigned to you or
                  reported by you.
                </p>
              </div>
            ) : (
              <div className="incident-table-wrapper">
                <table className="incident-table">
                  <thead>
                    <tr>
                      <th>Incident</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {overdueIncidents.map((incident) => (
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
                          {incident.dueDate
                            ? new Date(incident.dueDate).toLocaleString()
                            : "N/A"}
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
