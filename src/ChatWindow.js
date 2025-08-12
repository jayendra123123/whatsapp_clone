import React, { useState } from 'react';
import './App.css';

export default function ChatWindow({ messages, user, onSend }) {
  const [text, setText] = useState('');
  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="avatar">{user?.name ? user.name[0] : '?'}</div>
        <div>
          <div className="chat-name">{user?.name || 'Unknown'}</div>
          <div className="chat-number">{user?.wa_id}</div>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`chat-bubble${msg.fromMe ? ' me' : ''}`}
          >
            <div className="bubble-text">{msg.text}</div>
            <div className="bubble-meta">
              <span>{new Date(msg.timestamp * 1000).toLocaleString()}</span>
              <span className={`status ${msg.status}`}>{msg.status}</span>
            </div>
          </div>
        ))}
      </div>
      <form
        className="chat-input"
        onSubmit={e => {
          e.preventDefault();
          if (text.trim()) {
            onSend(text);
            setText('');
          }
        }}
      >
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
