// ...existing code...
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
// Enable CORS for all origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// MongoDB connection
mongoose.connect('mongodb+srv://jayendramallla:BfHZ47RiEnHswA9i@cluster0.5q3ycy1.mongodb.net/whatsapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const messageSchema = new mongoose.Schema({
  wa_id: String,
  name: String,
  id: String,
  meta_msg_id: String,
  text: String,
  timestamp: Number,
  status: String,
  fromMe: Boolean,
});
const Message = mongoose.model('processed_messages', messageSchema);

// API: Get all conversations grouped by wa_id
app.get('/api/conversations', async (req, res) => {
  const users = await Message.aggregate([
    { $group: { _id: '$wa_id', name: { $first: '$name' } } },
  ]);
  res.json(users.map(u => ({ wa_id: u._id, name: u.name })));
});

// API: Get messages for a user
app.get('/api/messages/:wa_id', async (req, res) => {
  const msgs = await Message.find({ wa_id: req.params.wa_id }).sort({ timestamp: 1 });
  res.json(msgs);
});

// API: Send message (demo)
app.post('/api/messages/:wa_id', async (req, res) => {
  const { text } = req.body;
  const msg = new Message({
    wa_id: req.params.wa_id,
    text,
    timestamp: Date.now(),
    status: 'sent',
    fromMe: true,
  });
  await msg.save();
  res.json(msg);
});

// Payload processor: Read JSON files and insert/update messages
app.post('/api/process-payloads', async (req, res) => {
  const payloadDir = path.join(__dirname, 'payloads');
  const files = fs.readdirSync(payloadDir).filter(f => f.endsWith('.json'));
  let inserted = 0, updated = 0;
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(payloadDir, file)));
    // WhatsApp webhook payloads
    if (data.payload_type === 'whatsapp_webhook' && data.metaData?.entry) {
      for (const entry of data.metaData.entry) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            // Insert messages
            if (change.value?.messages) {
              for (const msgObj of change.value.messages) {
                const doc = {
                  wa_id: (change.value.contacts && change.value.contacts[0]?.wa_id) || '',
                  name: (change.value.contacts && change.value.contacts[0]?.profile?.name) || '',
                  id: msgObj.id,
                  meta_msg_id: msgObj.id,
                  text: msgObj.text?.body || '',
                  timestamp: Number(msgObj.timestamp),
                  status: msgObj.status || 'sent',
                  fromMe: msgObj.fromMe || false,
                  type: msgObj.type,
                  payload_contacts: change.value.contacts,
                  payload_metadata: change.value.metadata,
                  payload_messaging_product: change.value.messaging_product,
                  payload_entry_id: entry.id,
                  payload_gs_app_id: data.metaData.gs_app_id,
                  payload_object: data.metaData.object,
                  payload_createdAt: data.createdAt,
                  payload_startedAt: data.startedAt,
                  payload_completedAt: data.completedAt,
                  payload_executed: data.executed
                };
                console.log('Inserting message:', doc);
                await Message.create(doc);
                inserted++;
              }
            }
            // Update statuses
            if (change.value?.statuses) {
              for (const statusObj of change.value.statuses) {
                const filter = statusObj.id ? { id: statusObj.id } : { meta_msg_id: statusObj.meta_msg_id };
                const result = await Message.updateMany(filter, {
                  status: statusObj.status,
                  status_conversation: statusObj.conversation,
                  status_gs_id: statusObj.gs_id,
                  status_pricing: statusObj.pricing,
                  status_recipient_id: statusObj.recipient_id,
                  status_timestamp: statusObj.timestamp
                });
                updated += result.modifiedCount;
              }
            }
          }
        }
      }
    }
    // Add support for old format (if any)
    if (data.type === 'message') {
      await Message.create({
        wa_id: data.wa_id,
        name: data.name,
        id: data.id,
        meta_msg_id: data.meta_msg_id,
        text: data.text,
        timestamp: data.timestamp,
        status: data.status || 'sent',
        fromMe: data.fromMe || false,
      });
      inserted++;
    } else if (data.type === 'status') {
      const filter = data.id ? { id: data.id } : { meta_msg_id: data.meta_msg_id };
      const result = await Message.updateMany(filter, { status: data.status });
      updated += result.modifiedCount;
    }
  }
  res.json({ inserted, updated });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Automatically process payloads on startup
  try {
    const payloadDir = path.join(__dirname, 'payloads');
    const files = fs.readdirSync(payloadDir).filter(f => f.endsWith('.json'));
    let inserted = 0, updated = 0;
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(payloadDir, file)));
      // WhatsApp webhook payloads
      if (data.payload_type === 'whatsapp_webhook' && data.metaData?.entry) {
        for (const entry of data.metaData.entry) {
          for (const change of entry.changes || []) {
            if (change.field === 'messages' && change.value?.statuses) {
              for (const statusObj of change.value.statuses) {
                const filter = statusObj.id ? { id: statusObj.id } : { meta_msg_id: statusObj.meta_msg_id };
                const result = await Message.updateMany(filter, { status: statusObj.status });
                updated += result.modifiedCount;
              }
            }
          }
        }
      }
      // Add support for old format (if any)
      if (data.type === 'message') {
        await Message.create({
          wa_id: data.wa_id,
          name: data.name,
          id: data.id,
          meta_msg_id: data.meta_msg_id,
          text: data.text,
          timestamp: data.timestamp,
          status: data.status || 'sent',
          fromMe: data.fromMe || false,
        });
        inserted++;
      } else if (data.type === 'status') {
        const filter = data.id ? { id: data.id } : { meta_msg_id: data.meta_msg_id };
        const result = await Message.updateMany(filter, { status: data.status });
        updated += result.modifiedCount;
      }
    }
    console.log(`Payloads processed on startup: Inserted ${inserted}, Updated ${updated}`);
  } catch (err) {
    console.error('Error processing payloads on startup:', err);
  }
});
