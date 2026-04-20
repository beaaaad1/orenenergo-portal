import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Импортируем контекст авторизации

const ChatAssistant = () => {
    const { user } = useAuth(); // Достаем текущего пользователя (id или name)
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Уникальный ключ для localStorage: если пользователь не залогинен, используем 'guest'
    const storageKey = user ? `chat_history_${user.id || user.username}` : 'chat_history_guest';

    // Инициализация: загружаем историю конкретно для этого пользователя
    const [chatHistory, setChatHistory] = useState<{ role: string, content: string }[]>([]);

    // Эффект для загрузки истории при смене пользователя или открытии чата
    useEffect(() => {
        const savedHistory = localStorage.getItem(storageKey);
        if (savedHistory) {
            setChatHistory(JSON.parse(savedHistory));
        } else {
            setChatHistory([]); // Если истории нет, очищаем экран
        }
    }, [storageKey]); // Сработает каждый раз, когда заходит новый пользователь

    // Эффект для автоматического сохранения при каждом новом сообщении
    useEffect(() => {
        if (chatHistory.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(chatHistory));
        }
    }, [chatHistory, storageKey]);

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

            if (!response.ok) throw new Error('Ошибка сервера');

            const data = await response.json();
            setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Ошибка связи с сервером.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Если пользователь не авторизован, можем вообще не показывать чат (опционально)
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
                <div className="card shadow-lg border-0" style={{ position: 'absolute', bottom: '80px', right: 0, width: '350px', height: '450px', borderRadius: '15px', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header bg-primary text-white p-3 d-flex justify-content-between align-items-center" style={{ borderRadius: '15px 15px 0 0' }}>
                        <div>
                            <h6 className="mb-0">ИИ-помощник</h6>
                            <small style={{ fontSize: '0.7rem', opacity: 0.8 }}>Личный чат: {user.username}</small>
                        </div>
                        <button
                            className="btn btn-sm btn-outline-light border-0"
                            onClick={() => { if(window.confirm('Очистить вашу историю?')) {
                                setChatHistory([]);
                                localStorage.removeItem(storageKey);
                            }}}
                        >
                            🗑️
                        </button>
                    </div>
                    <div className="card-body overflow-auto p-3" style={{ flex: 1 }}>
                        {chatHistory.map((chat, i) => (
                            <div key={i} className={`d-flex mb-2 ${chat.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                <div className={`p-2 rounded-3 small ${chat.role === 'user' ? 'bg-primary text-white' : 'bg-light text-dark shadow-sm'}`} style={{ maxWidth: '80%' }}>
                                    {chat.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className="text-muted small">Бот печатает...</div>}
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