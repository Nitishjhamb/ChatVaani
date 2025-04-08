import React, { useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./Chatbot.css";
import ChatVaaniLogo from "../assets/ChatVaaniLogo.svg"; // Make sure path is correct

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-thinking-exp-01-21",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536,
  responseMimeType: "text/plain",
};

const Chatbot = () => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const responseBox = useRef(null);
  const [timer, setTimer] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isTyping) {
      clearInterval(timer);
      setIsTyping(false);
      return;
    }
    appendMessage(message, "user");
    setIsTyping(true);

    const typingIndicator = document.createElement("div");
    typingIndicator.className = "message bot typing-indicator";
    typingIndicator.innerHTML = "<span></span><span></span><span></span>";
    responseBox.current.appendChild(typingIndicator);

    const chatSession = model.startChat({ generationConfig, history: [] });
    setMessage("");

    const result = await chatSession.sendMessage(message);

    typingIndicator.remove();
    setTimer(typeMessage(result.response.text(), "bot"));
    responseBox.current.scrollTop = responseBox.current.scrollHeight;
  };

  const scrollToBottom = () => {
    responseBox.current.scrollTop = responseBox.current.scrollHeight;
  };

  const typeMessage = (text, sender) => {
    let i = 0;
    const newMessage = document.createElement("div");
    newMessage.className = `message ${sender}`;
    responseBox.current.appendChild(newMessage);

    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n\s*\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
      .replace(/^-\s+/gm, "<li>")
      .replace(/<\/li>(?!<li>)/g, "</li></ul>")
      .replace(/<li>/, "<ul><li>");

    const finalText = formattedText.includes("<li>")
      ? formattedText.replace(/(<li><\/li>)+/, "<ul>$&</ul>")
      : formattedText;

    newMessage.innerHTML = finalText;

    scrollToBottom();

    const interval = setInterval(() => {
      if (i < finalText.length) {
        newMessage.innerHTML = finalText.substring(0, i);
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        scrollToBottom();
      }
    }, 5);

    return interval;
  };

  const appendMessage = (text, sender) => {
    const newMessage = document.createElement("div");
    newMessage.className = `message ${sender}`;
    newMessage.textContent = text;
    responseBox.current.appendChild(newMessage);
    responseBox.current.scrollTop = responseBox.current.scrollHeight;

    scrollToBottom();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img src={ChatVaaniLogo} alt="ChatVaani Logo" className="chat-logo" />
        <span>ChatVaani</span>
      </div>
      <div className="chat-box" ref={responseBox}></div>
      <form onSubmit={handleSubmit} className="chat-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask me anything..."
          className="chat-input"
          required
          disabled={isTyping}
        />
        <button type="submit" className="chat-button">
          {isTyping ? "Stop" : "Send"}
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
