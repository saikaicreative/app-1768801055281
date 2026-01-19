import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

const supabaseUrl = 'https://txegpqfuqclrrgqsphvy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZWdwcWZ1cWNscnJncXNwaHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDU1OTAsImV4cCI6MjA4NDMyMTU5MH0.jwFU7lSdJ1FiBFGNd9e4GKhJKmfRFDwYksGyPOglboA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    // TODO: Load chat history from Supabase
  }, []);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Insert message to Supabase and fetch new chat history
    setMessage('');
  };

  return (
    <div className="app">
      <div className="chat-container">
        {chatHistory.map((chat, index) => (
          <div key={index} className="chat-message">
            {chat.message}
          </div>
        ))}
      </div>
      <form className="message-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder="Type your message here..."
          className="message-input"
        />
        <button type="submit" className="send-button">Send</button>
      </form>
    </div>
  );
}

export default App;