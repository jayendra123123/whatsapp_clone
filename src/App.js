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
    fetch('https://whatsapp-clone-2bgo.onrender.com/api/conversations')
      .then(res => res.json())
      .then(data => setConversations(data.filter(u => u.wa_id && u.name)));
  }, []);

  useEffect(() => {
    if (selected) {
      fetch(`https://whatsapp-clone-2bgo.onrender.com/api/messages/${selected}`)
        .then(res => res.json())
        .then(msgs => setMessages(msgs));
      const u = conversations.find(u => u.wa_id === selected);
      setUser(u);
    }
  }, [selected, conversations]);

  const handleSend = async text => {
    await fetch(`https://whatsapp-clone-2bgo.onrender.com/api/messages/${selected}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    fetch(`https://whatsapp-clone-2bgo.onrender.com/api/messages/${selected}`)
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
