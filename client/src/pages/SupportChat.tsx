import { useState, useEffect, useRef } from 'react';
import api from '../api/axios.ts';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

interface Ticket {
  id: number;
  subject: string;
  status: string;
  created_at: string;
}

interface ChatUser {
  id: number;
  name: string;
  role: string;
}

interface Message {
  id: number;
  sender_id: number;
  text: string;
  is_admin_reply?: boolean;
  created_at: string;
}

const SupportChat = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'support' | 'users'>('support');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [usersList, setUsersList] = useState<ChatUser[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(true);

  // Состояния для уведомлений (красных точек)
  const [hasNewSupport, setHasNewSupport] = useState(false);
  const [hasNewPersonal, setHasNewPersonal] = useState(false);

  // Реф для отслеживания количества сообщений в текущем открытом чате
  const prevMessagesCount = useRef<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tab === 'support') {
          const res = await api.get('/support/tickets');
          setTickets(res.data);
        } else {
          const res = await api.get('/users');
          setUsersList(res.data.filter((u: ChatUser) => u.id !== user?.id));
        }
      } catch (err) {
        console.error("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab, user?.id]);

  useEffect(() => {
    let interval: any;
    const fetchMsgs = async () => {
      try {
        let res;
        if (tab === 'support' && selectedTicketId) {
          res = await api.get(`/support/tickets/${selectedTicketId}/messages`);
        } else if (tab === 'users' && selectedUserId) {
          res = await api.get(`/support/chats/messages/${selectedUserId}`);
        }

        if (res && res.data) {
          const newMessages = res.data;

          // Если количество сообщений увеличилось
          if (newMessages.length > prevMessagesCount.current) {
            const lastMsg = newMessages[newMessages.length - 1];

            // Если сообщение пришло от другого человека (не от меня)
            if (lastMsg.sender_id !== user?.id && prevMessagesCount.current !== 0) {
              // Если мы сейчас смотрим вкладку "Сотрудники", а пришло в "Поддержку" (и наоборот)
              if (tab === 'support' && selectedUserId) setHasNewPersonal(true);
              if (tab === 'users' && selectedTicketId) setHasNewSupport(true);
            }

            setMessages(newMessages);
            prevMessagesCount.current = newMessages.length;
          }
        }
      } catch (e) { console.error(e); }
    };

    if (selectedTicketId || selectedUserId) {
      fetchMsgs();
      interval = setInterval(fetchMsgs, 5000);
    } else {
      setMessages([]);
      prevMessagesCount.current = 0;
    }

    return () => clearInterval(interval);
  }, [selectedTicketId, selectedUserId, tab, user?.id]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    try {
      let res;
      if (tab === 'support' && selectedTicketId) {
        res = await api.post(`/support/tickets/${selectedTicketId}/messages`, { text: inputText });
      } else if (tab === 'users' && selectedUserId) {
        res = await api.post(`/support/chats/messages/${selectedUserId}`, { text: inputText });
      }
      if (res) {
        const myNewMsg = res.data;
        setMessages(prev => [...prev, myNewMsg]);
        prevMessagesCount.current += 1; // Обновляем реф сразу, чтобы не сработало уведомление на свой текст
        setInputText('');
      }
    } catch (err) {
      alert("Ошибка отправки");
    }
  };

  const createTicket = async () => {
    if (!newSubject.trim()) return;
    try {
      const res = await api.post('/support/tickets', { subject: newSubject });
      setTickets([res.data, ...tickets]);
      setSelectedTicketId(res.data.id);
      setNewSubject('');
    } catch (e) { alert("Ошибка создания тикета"); }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />
      <div className="container py-4 flex-grow-1">
        <div className="row g-3" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>

          {/* ЛЕВАЯ ПАНЕЛЬ */}
          <div className="col-md-4 h-100">
            <div className="card shadow-sm border-0 h-100 d-flex flex-column">
              <div className="d-flex border-bottom text-center">
                <div
                  className={`flex-fill py-3 cursor-pointer fw-bold small position-relative ${tab === 'support' ? 'border-bottom border-primary border-3 text-primary' : 'text-muted'}`}
                  onClick={() => {
                    setTab('support');
                    setSelectedUserId(null);
                    setHasNewSupport(false);
                    setMessages([]);
                  }}
                >
                  ПОДДЕРЖКА
                  {hasNewSupport && (
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ marginTop: '15px', marginLeft: '-20px' }}></span>
                  )}
                </div>
                <div
                  className={`flex-fill py-3 cursor-pointer fw-bold small position-relative ${tab === 'users' ? 'border-bottom border-primary border-3 text-primary' : 'text-muted'}`}
                  onClick={() => {
                    setTab('users');
                    setSelectedTicketId(null);
                    setHasNewPersonal(false);
                    setMessages([]);
                  }}
                >
                  СОТРУДНИКИ
                  {hasNewPersonal && (
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ marginTop: '15px', marginLeft: '-20px' }}></span>
                  )}
                </div>
              </div>

              <div className="card-body overflow-auto p-0">
                {tab === 'support' && (
                  <div className="p-3 border-bottom">
                    <div className="input-group input-group-sm">
                      <input className="form-control bg-light border-0 shadow-none" placeholder="Тема обращения..." value={newSubject} onChange={e => setNewSubject(e.target.value)} />
                      <button className="btn btn-primary" onClick={createTicket}>+</button>
                    </div>
                  </div>
                )}

                {loading ? <div className="p-4 text-center">Загрузка...</div> : (
                  tab === 'support' ? (
                    tickets.map(t => (
                      <div
                        key={t.id}
                        onClick={() => { setSelectedTicketId(t.id); prevMessagesCount.current = 0; }}
                        className={`p-3 border-bottom cursor-pointer ${selectedTicketId === t.id ? 'bg-primary bg-opacity-10 border-start border-primary border-4' : ''}`}
                      >
                        <div className="fw-bold small">{t.subject}</div>
                        <div className="text-muted" style={{ fontSize: '10px' }}>№{t.id} • {t.status}</div>
                      </div>
                    ))
                  ) : (
                    usersList.map(u => (
                      <div
                        key={u.id}
                        onClick={() => { setSelectedUserId(u.id); prevMessagesCount.current = 0; }}
                        className={`p-3 border-bottom cursor-pointer d-flex align-items-center gap-3 ${selectedUserId === u.id ? 'bg-primary bg-opacity-10 border-start border-primary border-4' : ''}`}
                      >
                        <div className="bg-primary rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '35px', height: '35px', fontSize: '12px' }}>{u.name[0]}</div>
                        <div>
                          <div className="fw-bold small">{u.name}</div>
                          <div className="text-muted" style={{ fontSize: '10px' }}>{u.role}</div>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>

          {/* ПРАВАЯ ПАНЕЛЬ (ЧАТ) */}
          <div className="col-md-8 h-100">
            <div className="card shadow-sm border-0 h-100 d-flex flex-column">
              {(selectedTicketId || selectedUserId) ? (
                <>
                  <div className="card-header bg-white py-3 border-bottom-0">
                    <h6 className="mb-0 fw-bold text-dark">
                      {tab === 'support'
                        ? `Тикет: ${tickets.find(t => t.id === selectedTicketId)?.subject}`
                        : `Чат с: ${usersList.find(u => u.id === selectedUserId)?.name}`
                      }
                    </h6>
                  </div>

                  <div className="card-body bg-light overflow-auto p-4 d-flex flex-column gap-3">
                    {messages.map((m) => {
                      const isMine = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                          <div className={`p-3 rounded-3 shadow-sm ${isMine ? 'bg-primary text-white' : 'bg-white text-dark border'}`} style={{ maxWidth: '75%' }}>
                            <div className="fw-bold mb-1" style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                              {isMine ? 'Вы' : (m.is_admin_reply ? 'Поддержка' : 'Собеседник')}
                            </div>
                            <div style={{ wordBreak: 'break-word', fontSize: '0.9rem' }}>{m.text}</div>
                            <div className={`text-end mt-1 ${isMine ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.6rem' }}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="card-footer bg-white p-3 border-top-0">
                    <div className="input-group shadow-sm rounded">
                      <input className="form-control border-0 bg-light shadow-none" placeholder="Напишите сообщение..." value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
                      <button className="btn btn-primary px-4 fw-bold" onClick={handleSendMessage}>Отправить</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="m-auto text-center opacity-50">
                  <i className="bi bi-chat-left-dots fs-1 d-block mb-2"></i>
                  <h5>Выберите диалог</h5>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportChat;