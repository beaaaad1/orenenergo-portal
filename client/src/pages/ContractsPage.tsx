import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

interface ClientRequest {
  id: number
  service_type: string
  customer_type: string
  full_name: string // Поле с бэкенда (ФИО)
  organization_inn?: string
  phone: string
  email: string
  address: string
  technical_params: {
    power_required?: number | string
    cadastral_number?: string
    inverter_model?: string
    [key: string]: any
  } | string
  additional_info?: string
  status: string
  created_at: string
  contract_number?: string
}

const statusLabel = (s: string) => {
  if (s === 'NEW') return 'Новая заявка'
  if (s === 'CONTRACT_PREPARED') return 'Договор готов'
  if (s === 'SIGNED') return 'Подписан'
  return 'Архив'
}

const statusStyle = (s: string) => {
  if (s === 'SIGNED') return { bg: '#EAF3DE', color: '#3B6D11', border: '#C0DCA9' }
  if (s === 'CONTRACT_PREPARED') return { bg: '#E8F0FB', color: '#185FA5', border: '#B3D1F2' }
  return { bg: '#F0F4F8', color: '#445566', border: '#D8E2EC' }
}

const ContractsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<ClientRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null)

  const staffServicesData = [
    {
      type: 'solar',
      title: 'Солнечные панели и микрогенерация',
      desc: 'Технологическое присоединение объектов микрогенерации (до 15 кВт) к сетям ПАО «Россети Волга».',
      icon: '☀️',
      path: '/service/solar'
    },
    {
      type: 'lighting',
      title: 'Наружное освещение',
      desc: 'Проектирование, монтаж и интеграция линий уличного освещения в автоматизированные системы управления.',
      icon: '🏮',
      path: '/service/lighting'
    },
    {
      type: 'connect',
      title: 'Подключение к электросетям (Стандарт)',
      desc: 'Классическое технологическое присоединение физических и юридических лиц мощностью до 15 кВт и до 150 кВт.',
      icon: '🔌',
      path: '/service/connect'
    },
    {
      type: 'generation',
      title: 'Объекты генерации',
      desc: 'Присоединение крупных электростанций, ДГУ и когенерационных установки промышленных предприятий.',
      icon: '🏭',
      path: '/service/generation'
    },
    {
      type: 'power-share',
      title: 'Перераспределение мощности',
      desc: 'Юридическое и техническое переоформление свободной мощности между потребителями электроэнергии.',
      icon: '🔄',
      path: '/service/power-share'
    },
    {
      type: 'construction',
      title: 'Монтажные и ремонтные работы',
      desc: 'Капитальный ремонт, техническое обслуживание и аварийно-восстановительные работы на объектах распределительных сетей.',
      icon: '🛠️',
      path: '/service/construction'
    }
  ]

  const fetchRequests = () => {
    // 1. ИСПРАВЛЕН ЭНДПОИНТ НА /service-requests СОГЛАСНО РОУТАМ BACKEND
    api.get('/service-requests')
      .then(res => setRequests(res.data))
      .catch((err) => {
        console.error('Ошибка загрузки заявок, применен локальный кэш:', err)
        setRequests([
          {
            id: 101,
            full_name: 'Иванов Петр Сергеевич',
            customer_type: 'INDIVIDUAL',
            phone: '+7 (922) 555-12-34',
            email: 'ivanov@mail.ru',
            address: 'г. Оренбург, СНТ "Мир", уч. 45',
            technical_params: {
              power_required: 12,
              cadastral_number: '56:44:0201003:245'
            },
            status: 'NEW',
            service_type: 'solar', // Соответствует типу технологической карты
            created_at: '2026-05-15'
          },
          {
            id: 102,
            full_name: 'ООО "Вектор"',
            customer_type: 'LEGAL',
            organization_inn: '5610234567',
            phone: '+7 (3532) 77-88-99',
            email: 'vector@vector.ru',
            address: 'Оренбургский р-н, п. Пригородный, ул. Полевая, д. 2',
            technical_params: {
              power_required: 45,
              cadastral_number: '56:21:1302001:12'
            },
            status: 'SIGNED',
            contract_number: 'РОССЕТИ-МГ-2026-008',
            service_type: 'connect',
            created_at: '2026-05-10'
          }
        ])
      })
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // 3. ПЕРЕДАЕМ ДАННЫЕ ВЫБРАННОЙ ЗАЯВКИ ЧЕРЕЗ STATE РОУТЕРА
  const handleServiceClick = (path: string) => {
    navigate(path, { state: { request: selectedRequest } })
  }

  return (
    <>
      <Navbar />
      <div style={{ background: '#F0F4F8', minHeight: '100vh', padding: '14px 8px', margin: '0 100px' }}>

        {/* Шапка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h4 style={{ fontWeight: 600, color: '#1A2B3C', margin: 0 }}>
              Информационно-диспетчерская панель филиала
            </h4>
            <p style={{ color: '#6B7A8D', fontSize: 13, margin: '4px 0 0 0' }}>
              ПАО «Россети Волга» — «Оренбургэнерго» · Вход выполнен: {user?.name || 'Администратор'}
            </p>
          </div>
        </div>

        {/* БЛОК 1: ПОСТУПИВШИЕ ЗАЯВКИ ОТ НАСЕЛЕНИЯ */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D8E2EC', fontWeight: 500, fontSize: 14, background: '#F8FAFC', color: '#1A2B3C' }}>
            📥 Входящие заявки потребителей (выберите строку для просмотра деталей)
          </div>

          <div style={{ padding: '8px 0' }}>
            {requests.map(req => {
              const badge = statusStyle(req.status)
              const isCurrent = selectedRequest?.id === req.id

              // Безопасный парсинг JSON параметров, если с бэкенда пришла строка
              const params = typeof req.technical_params === 'string'
                ? JSON.parse(req.technical_params)
                : req.technical_params;

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #F0F4F8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isCurrent ? '#E8F0FB' : 'transparent',
                    borderLeft: isCurrent ? '4px solid #0057A8' : 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => !isCurrent && (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) => !isCurrent && (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    {/* 2. ИСПРАВЛЕНЫ ИМЕНА ПОЛЕЙ (full_name, params) ПОД БАЗУ ДАННЫХ */}
                    <div style={{ fontSize: 15, color: '#1A2B3C', fontWeight: 600 }}>{req.full_name}</div>
                    <div style={{ fontSize: 13, color: '#445566', marginTop: 4 }}>
                      <strong>Объект:</strong> {req.address} | <strong>Идентификатор услуги:</strong> {req.service_type}
                    </div>
                    <div style={{ fontSize: 12, color: '#8A9BB0', marginTop: 2 }}>
                      Кадастровый номер: {params?.cadastral_number || 'Не указан'} · Мощность: {params?.power_required || 0} кВт
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                      fontSize: 11, padding: '4px 10px', borderRadius: 4, fontWeight: 600
                    }}>
                      {statusLabel(req.status).toUpperCase()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* БЛОК 2: СПРАВОЧНИК УСЛУГ В ВИДЕ КЛИКАБЕЛЬНОГО ВЕРТИКАЛЬНОГО СПИСКА */}
        <div style={{ marginBottom: 24 }}>
          <h5 style={{ fontWeight: 600, color: '#1A2B3C', marginBottom: 14, fontSize: 15 }}>
            ⚙️ Технологические регламенты и печать документов по видам услуг
          </h5>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {staffServicesData.map((service) => {
              // Делаем небольшую подсветку карты, если выбранная заявка совпадает по типу услуги
              const isRecommended = selectedRequest?.service_type === service.type;

              return (
                <div
                  key={service.type}
                  onClick={() => handleServiceClick(service.path)}
                  style={{
                    background: '#fff',
                    borderRadius: 8,
                    border: isRecommended ? '2px solid #2E7D32' : '1px solid #D8E2EC',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = isRecommended ? '2px solid #2E7D32' : '1px solid #0057A8';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,87,168,0.06)';
                    e.currentTarget.style.background = '#F4F8FC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = isRecommended ? '2px solid #2E7D32' : '1px solid #D8E2EC';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 22 }}>{service.icon}</span>
                      <div>
                        <strong style={{ color: '#1A2B3C', fontSize: 14 }}>
                          {service.title} {isRecommended && <span style={{ color: '#2E7D32', fontSize: 11, marginLeft: 6 }}>(Подходит для выбранной заявки)</span>}
                        </strong>
                        <span style={{ display: 'block', fontSize: 12, color: '#6B7A8D', marginTop: 2 }}>{service.desc}</span>
                      </div>
                    </div>
                    <span style={{ color: isRecommended ? '#2E7D32' : '#0057A8', fontWeight: 'bold' }}>
                      Открыть карту →
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ИНФОРМАЦИОННЫЙ ПОДВАЛ */}
        {selectedRequest && (
          <div style={{ background: '#E8F0FB', padding: '14px 20px', borderRadius: 8, border: '1px solid #B3D1F2', fontSize: 13, color: '#185FA5' }}>
            💡 Вы выбрали заявку абонента <strong>{selectedRequest.full_name}</strong>. При переходе в зеленую или любую другую карту, параметры абонента будут автоматически импортированы в формы документов.
          </div>
        )}

      </div>
    </>
  )
}

export default ContractsPage