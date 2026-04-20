import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ChatAssistant = () => {
    const { user }: any = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ role: string, content: string }[]>([]);

    const userId = user?.id || user?.name || user?.username || 'guest';
    const storageKey = `chat_history_${userId}`;

    useEffect(() => {
        setChatHistory([]);

        if (user) {
            const savedHistory = localStorage.getItem(storageKey);
            if (savedHistory) {
                try {
                    const parsed = JSON.parse(savedHistory);
                    if (Array.isArray(parsed)) {
                        setChatHistory(parsed);
                    }
                } catch (e) {
                    console.error("Ошибка чтения истории", e);
                }
            }
        }
    }, [userId, storageKey, user]);

    useEffect(() => {
        if (user && chatHistory.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(chatHistory));
        }
    }, [chatHistory, storageKey, user]);

    const handleSend = async () => {
        if (!message.trim()) return;

        const userMsg = { role: 'user', content: message };
        const updatedHistory = [...chatHistory, userMsg];

        setChatHistory(updatedHistory);
        setMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    messages: updatedHistory
                }),
            });

            if (!response.ok) throw new Error('Сервер не отвечает');

            const data = await response.json();
            const botReply = { role: 'assistant', content: data.reply };

            setChatHistory(prev => [...prev, botReply]);
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Ошибка сервера. Попробуйте позже.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                style={{ width: '60px', height: '60px' }}
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {isOpen && (
                <div className="card shadow-lg border-0" style={{
                    position: 'absolute', bottom: '80px', right: 0,
                    width: '350px', height: '450px', borderRadius: '15px',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div className="card-header bg-primary text-white p-3 d-flex justify-content-between align-items-center" style={{ borderRadius: '15px 15px 0 0' }}>
                        <div>
                            <h6 className="mb-0">ИИ-помощник</h6>
                            <small style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                Сессия: {user.name || user.id || 'Пользователь'}
                            </small>
                        </div>
                        <button
                            className="btn btn-sm btn-outline-light border-0"
                            onClick={() => {
                                if(window.confirm('Очистить вашу историю?')) {
                                    localStorage.removeItem(storageKey);
                                    setChatHistory([]);
                                }
                            }}
                        >
                            🗑️
                        </button>
                    </div>

                    <div className="card-body overflow-auto p-3" style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
                        {chatHistory.map((chat, i) => (
                            <div key={i} className={`d-flex mb-2 ${chat.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                <div className={`p-2 rounded-3 small ${chat.role === 'user' ? 'bg-primary text-white' : 'bg-white text-dark shadow-sm'}`} style={{ maxWidth: '80%' }}>
                                    {chat.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className="text-muted small">Бот думает...</div>}
                    </div>

                    <div className="card-footer bg-white border-0 p-3">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control form-control-sm shadow-none"
                                placeholder="Ваш вопрос..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button className="btn btn-primary btn-sm px-3" onClick={handleSend}>➤</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatAssistant;