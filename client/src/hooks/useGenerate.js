import { useState, useRef } from "react";
import api from "../utils/api";

export function useGenerate() {
  const [loading, setLoading]       = useState(false);
  const [streamText, setStreamText] = useState("");
  const [content, setContent]       = useState(null);
  const [error, setError]           = useState("");
  const streamRef = useRef("");

  const generate = async (params, { stream = true } = {}) => {
    setLoading(true);
    setError("");
    setContent(null);
    setStreamText("");
    streamRef.current = "";

    try {
      if (stream) {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/generate/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(params),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Generation failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const raw = decoder.decode(value);
          for (const line of raw.split("\n")) {
            if (!line.startsWith("data:")) continue;
            try {
              const json = JSON.parse(line.slice(5).trim());
              if (json.type === "chunk") {
                streamRef.current += json.text;
                setStreamText(streamRef.current);
              } else if (json.type === "done") {
                setContent(json.content);
              } else if (json.type === "error") {
                throw new Error(json.message);
              }
            } catch (e) { /* partial JSON */ }
          }
        }
      } else {
        const { data } = await api.post("/generate", params);
        setContent(data.content);
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setContent(null);
    setStreamText("");
    setError("");
  };

  return { generate, loading, streamText, content, error, reset };
}
