import React, { useRef, useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mic, Send, Menu, Plus, Download } from "lucide-react";
import "./Chatbot.scss";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-thinking-exp-01-21",
});

const config = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536,
  responseMimeType: "text/plain",
};

const ChatVaani = () => {
  const [chatSessions, setChatSessions] = useState([]);
  const [currentChat, setCurrentChat] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("chatvaani_sessions");
    if (saved) {
      setChatSessions(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatvaani_sessions", JSON.stringify(chatSessions));
  }, [chatSessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    const updatedChat = [...currentChat, userMsg];
    setCurrentChat(updatedChat);
    setIsTyping(true);
    setInput("");

    const chatSession = model.startChat({
      generationConfig: config,
      history: updatedChat.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    });

    try {
      const result = await chatSession.sendMessage(input);
      const botMsg = {
        role: "bot",
        content: result.response.text(),
        timestamp: new Date().toISOString(),
      };
      setCurrentChat((prev) => [...prev, botMsg]);
    } catch {
      setCurrentChat((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Sorry, something went wrong.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
    setIsTyping(false);
    scrollToBottom();
  };

  const startNewChat = () => {
    if (currentChat.length > 0) {
      setChatSessions((prev) => [...prev, currentChat]);
    }
    setCurrentChat([]);
  };

  const downloadCurrentChat = () => {
    const blob = new Blob([JSON.stringify(currentChat, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chatvaani_session_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="chatvaani-ui">
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={24} />
        </div>
        {sidebarOpen ? (
          <div className="history">
            <div className="new-chat" onClick={startNewChat}>
              <Plus size={16} /> New Chat
            </div>
            <div className="new-chat" onClick={downloadCurrentChat}>
              <Download size={16} /> Export Chat
            </div>
            {chatSessions.map((session, idx) => (
              <div
                key={idx}
                className="history-item"
                onClick={() => setCurrentChat(session)}
              >
                {session[0]?.content?.slice(0, 30) || "Untitled"} –{" "}
                {new Date(
                  session[0]?.timestamp || Date.now()
                ).toLocaleTimeString()}
              </div>
            ))}
          </div>
        ) : (
          <div className="new-chat-icon" onClick={startNewChat}>
            <Plus size={20} />
          </div>
        )}
      </aside>

      <main className="chat-area">
        <header className="chat-header">
          <div className="avatar-ring">
            <div className="ring"></div>
            <img src="/assets/ai-avatar.png" alt="AI" className="avatar" />
          </div>
          <span className="title">ChatVaani</span>
        </header>

        <div className="chat-box">
          {currentChat.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="bubble">{msg.content}</div>
            </div>
          ))}
          {isTyping && (
            <div className="message bot">
              <div className="bubble typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input" onSubmit={sendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
          />
          <button type="button" className="mic">
            <Mic size={20} />
          </button>
          <button type="submit">
            <Send size={20} />
          </button>
        </form>
      </main>
    </div>
  );
};

export default ChatVaani;
