import { useCallback, useRef, useState } from "react";
import { API_BASE_URL, API_TIMEOUT_MS } from "../api/axios";

/**
 * useChat — manages the Empower AI assistant conversation.
 *
 * Streams Server-Sent Events from POST /api/v1/chat using fetch +
 * ReadableStream (axios cannot stream responses in the browser).
 * The JWT token is attached manually to mirror the axios interceptor.
 *
 * SSE event contract:
 *   {"type":"meta","conversationId":"..."}
 *   {"type":"delta","text":"..."}     ← streamed answer tokens
 *   {"type":"tool","name":"..."}      ← assistant is querying data
 *   {"type":"done"}
 *   {"type":"error","message":"..."}
 */
export function useChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm the MarSU Empower Intelligence Assistant. Ask me about enrollment trends, research output, licensure performance, or budget utilization.",
      reports: [],
    },
  ]);
  const [reasoning, setReasoning] = useState(""); // model thinking text
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState(null); // e.g. "getEnrollmentTrend"
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  /** Abort any in-flight stream (e.g., when the chat window closes). */
  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
    setToolStatus(null);
  }, []);

  /**
   * Send a user message and stream the assistant's reply.
   * @param {string} text
   */
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || "").trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      setToolStatus(null);
      setReasoning("");

      // Optimistic user message + empty assistant bubble to stream into.
      const userMessage = { role: "user", content: trimmed };
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));
      setMessages((prev) => [
        ...prev,
        userMessage,
        { role: "assistant", content: "", reports: [] },
      ]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      // Safety timeout — matches the axios instance default.
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message: trimmed, history }),
          signal: controller.signal,
        });

        if (!response.ok) {
          let message = `Request failed (${response.status}).`;
          try {
            const body = await response.json();
            if (body?.message) message = body.message;
          } catch {
            /* non-JSON error body */
          }
          throw new Error(message);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let sawDone = false;

        // Parse SSE frames: events are separated by a blank line, and each
        // data line carries one JSON object.
        const handleEvent = (raw) => {
          const lines = raw.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            let event;
            try {
              event = JSON.parse(payload);
            } catch {
              continue;
            }
            if (event.type === "delta") {
              setReasoning(""); // clear reasoning once content arrives
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = {
                    ...last,
                    content: last.content + event.text,
                  };
                }
                return next;
              });
            } else if (event.type === "reasoning") {
              setReasoning((prev) => prev + event.text);
            } else if (event.type === "tool") {
              setToolStatus(event.name);
            } else if (event.type === "report") {
              // Structured tool data — attach to the streaming assistant
              // message so the UI can offer a visual report.
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = {
                    ...last,
                    reports: [
                      ...(last.reports || []),
                      { name: event.name, data: event.data },
                    ],
                  };
                }
                return next;
              });
            } else if (event.type === "error") {
              throw new Error(event.message);
            } else if (event.type === "done") {
              sawDone = true;
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let separatorIndex;
          while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
            const rawEvent = buffer.slice(0, separatorIndex);
            buffer = buffer.slice(separatorIndex + 2);
            handleEvent(rawEvent);
          }
        }

        if (!sawDone) {
          // Stream ended without a done event — treat as truncation.
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant" && !last.content) {
              next[next.length - 1] = {
                ...last,
                content: "The response was interrupted. Please try again.",
              };
            }
            return next;
          });
        } else {
          // done received — guard against an empty answer (e.g. model
          // returned only reasoning with no content).
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant" && !last.content) {
              next[next.length - 1] = {
                ...last,
                content:
                  "The assistant did not produce a text response. Please try rephrasing your question.",
              };
            }
            return next;
          });
        }
      } catch (err) {
        if (err.name === "AbortError") {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant" && !last.content) {
              next.pop(); // remove the empty bubble
            }
            return next;
          });
        } else {
          setError(err.message || "Something went wrong. Please try again.");
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant" && !last.content) {
              next.pop();
            }
            return next;
          });
        }
      } finally {
        clearTimeout(timeoutId);
        abortRef.current = null;
        setIsStreaming(false);
        setToolStatus(null);
        setReasoning("");
      }
    },
    [messages, isStreaming],
  );

  /** Clear the conversation back to the greeting. */
  const reset = useCallback(() => {
    stop();
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm the MarSU Empower Intelligence Assistant. Ask me about enrollment trends, research output, licensure performance, or budget utilization.",
        reports: [],
      },
    ]);
    setError(null);
    setReasoning("");
  }, [stop]);

  return { messages, isStreaming, toolStatus, reasoning, error, sendMessage, stop, reset };
}
