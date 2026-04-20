import { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminSupport = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [selectedMsgId, setSelectedMsgId] = useState<number | null>(null);

  const loadMessages = async () => {
    const res = await api.get('/support/messages');
    setMessages(res.data);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleReply = async (id: number) => {
    if (!replyText) return;
    await api.post('/support/reply', { text: replyText, replyToId: id });
    setReplyText('');
    setSelectedMsgId(null);
    loadMessages(); // Обновляем список
  };

  return (
    <div className="container py-4">
      <h3 className="mb-4">Запросы в поддержку</h3>
      <div className="list-group">
        {messages.map((m) => (
          <div key={m.id} className={`list-group-item ${m.is_read ? 'bg-white' : 'bg-light border-primary'}`}>
            <div className="d-flex justify-content-between">
              <h6 className="mb-1 fw-bold">{m.sender}</h6>
              <small className="text-muted">{new Date(m.created_at).toLocaleString()}</small>
            </div>
            <p className="mb-2">{m.text}</p>

            {!m.is_admin_reply && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setSelectedMsgId(m.id)}
              >
                Ответить
              </button>
            )}

            {selectedMsgId === m.id && (
              <div className="mt-3">
                <textarea
                  className="form-control mb-2"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Введите текст ответа..."
                />
                <button className="btn btn-primary btn-sm" onClick={() => handleReply(m.id)}>Отправить ответ</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSupport;