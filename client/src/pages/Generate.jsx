import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PromptForm    from "../components/editor/PromptForm";
import ContentEditor from "../components/editor/ContentEditor";
import PlatformPreview from "../components/editor/PlatformPreview";
import ScheduleModal from "../components/scheduler/ScheduleModal";
import { useGenerate }   from "../hooks/useGenerate";
import { useScheduler }  from "../hooks/useScheduler";
import { useAuth }       from "../context/AuthContext";
import api from "../utils/api";

const defaultValues = {
  topic: "", platform: "twitter", tone: "Professional",
  contentType: "Post", keywords: "", scheduledAt: "",
};

export default function Generate() {
  const { user }                  = useAuth();
  const navigate                  = useNavigate();
  const { generate, loading, streamText, content, error, reset } = useGenerate();
  const { schedulePost }          = useScheduler();
  const [values, setValues]       = useState(defaultValues);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("editor"); // editor | preview
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerate = () => {
    generate({
      topic:       values.topic,
      platform:    values.platform,
      tone:        values.tone,
      contentType: values.contentType,
      keywords:    values.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    });
  };

  const handleEdit = async (newText) => {
    if (!content) return;
    try {
      await api.patch(`/generate/${content._id}`, { generatedText: newText });
      showToast("Content updated");
    } catch (e) {
      showToast("Failed to save edit", "error");
    }
  };

  const handleSchedule = async ({ contentId, platform, scheduledAt, note }) => {
    await schedulePost({ contentId, platform, scheduledAt, note });
    showToast(`Scheduled for ${new Date(scheduledAt).toLocaleString()}`);
    navigate("/calendar");
  };

  const handleSaveDraft = () => {
    showToast("Saved as draft");
    reset();
    setValues(defaultValues);
  };

  return (
    <div className="page slide-in">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: toast.type === "error" ? "#1a0a0a" : "#0a1a10",
          border: `1px solid ${toast.type === "error" ? "#ef444440" : "#10b98140"}`,
          color: toast.type === "error" ? "#fca5a5" : "#6ee7b7",
          boxShadow: "0 8px 32px #00000060",
        }}>{toast.msg}</div>
      )}

      <div className="page-header">
        <h1 className="page-title">✦ Generate Content</h1>
        <p className="page-subtitle">AI-powered, platform-optimized content in seconds</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 24 }}>
        {/* Left: form */}
        <div>
          <PromptForm values={values} onChange={setValues} onSubmit={handleGenerate} loading={loading} />
          {error && <p className="error-msg" style={{ marginTop: 12 }}>⚠ {error}</p>}
        </div>

        {/* Right: editor + preview */}
        <div>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1e1c2e", marginBottom: 20 }}>
            {["editor", "preview"].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                background: "transparent", border: "none", borderBottom: `2px solid ${activeTab === t ? "#6366f1" : "transparent"}`,
                color: activeTab === t ? "#a5b4fc" : "#6b6880", padding: "8px 18px",
                fontSize: 13, fontWeight: 500, textTransform: "capitalize", transition: "all 0.2s",
              }}>{t}</button>
            ))}
          </div>

          {activeTab === "editor" ? (
            <ContentEditor
              content={content}
              streamText={streamText}
              platform={values.platform}
              generating={loading}
              onEdit={handleEdit}
            />
          ) : (
            <PlatformPreview
              platform={values.platform}
              text={content?.generatedText || streamText}
              username={user?.name}
            />
          )}

          {/* CTA buttons */}
          {content && !loading && (
            <div style={{ display: "flex", gap: 10, marginTop: 16 }} className="slide-in">
              <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ flex: 1 }}>
                ⏰ Schedule Post
              </button>
              <button className="btn btn-ghost" onClick={handleSaveDraft}>Save Draft</button>
              <button className="btn btn-ghost" onClick={() => {
                navigator.clipboard.writeText(content.generatedText);
                showToast("Copied!");
              }}>⎘</button>
            </div>
          )}
        </div>
      </div>

      {showModal && content && (
        <ScheduleModal
          content={content}
          onSchedule={handleSchedule}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
