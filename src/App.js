import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import './App.css';

function App() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/conversations')
      .then(res => res.json())
      .then(data => setConversations(data.filter(u => u.wa_id && u.name)));
  }, []);

  useEffect(() => {
    if (selected) {
      fetch(`http://localhost:5000/api/messages/${selected}`)
        .then(res => res.json())
        .then(msgs => setMessages(msgs));
      const u = conversations.find(u => u.wa_id === selected);
      setUser(u);
    }
  }, [selected, conversations]);

  const handleSend = async text => {
    await fetch(`http://localhost:5000/api/messages/${selected}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    fetch(`http://localhost:5000/api/messages/${selected}`)
      .then(res => res.json())
      .then(msgs => setMessages(msgs));
  };

  return (
    <div className="app-container">
      <Sidebar
        conversations={conversations}
        selected={selected}
        onSelect={setSelected}
      />
      {selected && (
        <ChatWindow
          messages={messages}
          user={user}
          onSend={handleSend}
        />
      )}
      {!selected && (
        <div className="empty-chat">Select a chat to start messaging</div>
      )}
    </div>
  );
}

export default App;
