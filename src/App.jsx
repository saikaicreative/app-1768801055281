import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Mic, MicOff, Send } from 'lucide-react';
import './index.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you today?' }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? prev + ' ' + transcript : transcript);
      };
    }
  }, []);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // utterance.lang = 'en-US'; 
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    } else {
      alert("Speech recognition not supported in this browser.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Optimistically update UI, then save/fetch
      // Save to Supabase (fire and forget mostly, or log error)
      supabase.from('chats').insert([{ message: input, role: 'user', created_at: new Date() }]).then(({ error }) => {
        if (error) console.error("Supabase error:", error);
      });

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant. Keep answers concise." },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: input }
        ],
        model: "gpt-3.5-turbo",
      });

      const reply = completion.choices[0].message.content;
      const aiMsg = { role: 'assistant', content: reply };

      setMessages(prev => [...prev, aiMsg]);
      speak(reply);

      supabase.from('chats').insert([{ message: reply, role: 'assistant', created_at: new Date() }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Could not reach AI. Check API Key or Network." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <div className={`avatar ${msg.role}`}>
              {msg.role === 'assistant' ? 'AI' : 'U'}
            </div>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && <div className="chat-message ai"><div className="avatar ai">AI</div><div className="message-content">Thinking...</div></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <form className="input-wrapper" onSubmit={handleSubmit}>
          <input
            className="message-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message..."
          />
          <button
            type="button"
            className={`mic-button ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button type="submit" className="send-button">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;