import React from 'react';
import './App.css';

export default function Sidebar({ conversations, selected, onSelect }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">Chats</div>
      {conversations.map(user => (
        <div
          key={user.wa_id}
          className={`sidebar-chat${selected === user.wa_id ? ' selected' : ''}`}
          onClick={() => onSelect(user.wa_id)}
        >
          <div className="avatar">{user.name ? user.name[0] : '?'}</div>
          <div>
            <div className="chat-name">{user.name || 'Unknown'}</div>
            <div className="chat-number">{user.wa_id}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
