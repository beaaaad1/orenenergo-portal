import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import Swal from 'sweetalert2'

const ConnectServicePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Управление модальным окном просмотра документа: 'contract' | 'order' | null
  const [activeDoc, setActiveDoc] = useState<'contract' | 'order' | null>(null)

  // Переключатель типа заявителя: true = Юр. лицо, false = Физ. лицо
  const [isOrganization, setIsOrganization] = useState<boolean>(true)

  // Все поля инициализированы пустыми строками
  const [calcData, setCalcData] = useState({
    // Реквизиты физлица
    individualName: '',
    passportData: '',

    // Реквизиты контрагента (Юр. лица)
    clientName: '',
    inn: '',
    kpp: '',
    ogrn: '',
    directorName: '',
    directorTitle: '',

    // Общие контактные данные
    phone: '',
    email: '',
    address: '',
    cadastralNumber: '',

    // Договорные параметры
    contractNumber: '',
    warrantyMonths: '',

    // Техническая спецификация объекта техприсоединения
    powerRequested: '',          // Запрашиваемая мощность в кВт
    voltageLevel: '',            // Уровень напряжения (например, 0.4 кВ)
    reliabilityClass: '',        // Категория надежности
    sourceSubstation: '',        // Питающая подстанция
    meterCost: '',               // Стоимость прибора учета
    workCost: ''                 // Стоимость строительно-монтажных работ
  })

  // Динамический калькулятор стоимости на лету
  const meterPrice = Number(calcData.meterCost || 0)
  const workPrice = Number(calcData.workCost || 0)
  const totalCost = meterPrice + workPrice
  const vatCost = Math.round(totalCost * 0.20) // НДС 20%

  const handlePrint = () => {
    window.print()
  }

  // Отправка JSON-структуры документа на бэкенд
  const handleApproveAndSend = async (docType: 'Договор' | 'Наряд') => {
    try {
      const targetCategory = docType === 'Договор' ? 'contract' : 'order'

      const payload = {
        title: `${docType} № ${calcData.contractNumber || 'Б/Н'} (Техприсоединение)`,
        category: targetCategory,
        department: 'Служба технологического присоединения',
        metaData: {
          ...calcData,
          isOrganization,
          totalCost,
          vatCost,
          generatedBy: user?.name || 'Оператор системы'
        }
      }

      Swal.fire({
        title: 'Сохранение документа...',
        text: 'Пожалуйста, подождите',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading() }
      })

      await api.post('/documents/json', payload)

      Swal.fire({
        icon: 'success',
        title: 'Успешно!',
        text: `${docType} успешно сохранен в базу данных системы.`,
        confirmButtonColor: '#10B981'
      })

      setActiveDoc(null)
    } catch (err: any) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Ошибка сохранения',
        text: err.response?.data?.message || 'Не удалось отправить данные документа на сервер.'
      })
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ background: '#F4F7FA', minHeight: '100vh', padding: '20px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

          {/* Кнопка возврата */}
          <div className="d-print-none" style={{ marginBottom: 15 }}>
            <button
              onClick={() => navigate('/contracts')}
              className="btn btn-link p-0 text-decoration-none"
              style={{ color: '#0057A8', fontWeight: 500 }}
            >
              ← Вернуться в панель договоров
            </button>
          </div>

          {/* Зеленая/Бирюзовая Шапка */}
          <div className="d-print-none shadow-sm" style={{ background: '#10B981', color: '#fff', padding: '24px', borderRadius: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 36 }}>⚡</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700 }}>Технологическая карта: Технологическое присоединение</h4>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: 13 }}>
                  Формирование договоров подряда и нарядов СМР «Оренбургэнерго»
                </p>
              </div>
            </div>
          </div>

          {/* СЕКЦИЯ СВЕРХУ: Текст и нормативная информация */}
          <div className="card shadow-sm d-print-none" style={{ borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, background: '#fff', marginBottom: 20 }}>
            <h5 style={{ fontWeight: 700, color: '#1E293B', borderBottom: '2px solid #F1F5F9', paddingBottom: 8, marginBottom: 12 }}>
              ℹ️ Нормативные стандарты и справочная информация (Техприсоединение)
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, fontSize: 13, color: '#475569', lineHeight: '1.5' }}>
              <div>
                <strong>• Постановление Правительства РФ № 861:</strong> Устанавливает строгие правила недискриминационного доступа к электрическим сетям и регламент выполнения технических условий (ТУ).
              </div>
              <div>
                <strong>• Интеллектуальный учёт:</strong> Все устанавливаемые приборы коммерческого учёта должны поддерживать удалённую передачу данных в систему ИСУЭ филиала «Оренбургэнерго».
              </div>
              <div>
                <strong>• Граница ответственности:</strong> По умолчанию устанавливается на контактах вводного автомата в шкафу учёта на границе земельного участка заявителя.
              </div>
            </div>
          </div>

          {/* СЕКЦИЯ СНИЗУ: Форма заполнения всех данных (на всю ширину) */}
          <div className="card shadow-sm d-print-none" style={{ borderRadius: 12, border: '1px solid #E2E8F0', padding: 25, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #F1F5F9', paddingBottom: 12, marginBottom: 20 }}>
              <h5 style={{ fontWeight: 700, color: '#1E293B', margin: 0 }}>
                📋 Заполнение параметров и расчёт ТУ
              </h5>

              {/* Переключатель типа контрагента */}
              <div className="btn-group" role="group" style={{ width: '300px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${isOrganization ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setIsOrganization(true)}
                  style={{ fontWeight: 600 }}
                >
                  Юридическое лицо
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${!isOrganization ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setIsOrganization(false)}
                  style={{ fontWeight: 600 }}
                >
                  Физическое лицо
                </button>
              </div>
            </div>

            {/* Сетка полей ввода формы */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Блок 1: Реквизиты заявителя */}
              <div>
                <h6 style={{ fontWeight: 600, color: '#475569', marginBottom: 12, fontSize: 14 }}>1. Данные заявителя</h6>
                {isOrganization ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>НАИМЕНОВАНИЕ ОРГАНИЗАЦИИ</label>
                      <input type="text" className="form-control form-control-sm" placeholder="Напр. ООО ИнвестСтрой" value={calcData.clientName} onChange={e => setCalcData({...calcData, clientName: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ИНН</label>
                      <input type="text" className="form-control form-control-sm" placeholder="10-значный код" value={calcData.inn} onChange={e => setCalcData({...calcData, inn: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>КПП</label>
                      <input type="text" className="form-control form-control-sm" placeholder="9-значный код" value={calcData.kpp} onChange={e => setCalcData({...calcData, kpp: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ОГРН</label>
                      <input type="text" className="form-control form-control-sm" placeholder="ОГРН организации" value={calcData.ogrn} onChange={e => setCalcData({...calcData, ogrn: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ДОЛЖНОСТЬ РУКОВОДИТЕЛЯ</label>
                      <input type="text" className="form-control form-control-sm" placeholder="Напр. Директор" value={calcData.directorTitle} onChange={e => setCalcData({...calcData, directorTitle: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ФИО РУКОВОДИТЕЛЯ (В РОД. ПАДЕЖЕ)</label>
                      <input type="text" className="form-control form-control-sm" placeholder="Напр. Петрова Ивана Сергеевича" value={calcData.directorName} onChange={e => setCalcData({...calcData, directorName: e.target.value})} />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ФИО ФИЗИЧЕСКОГО ЛИЦА</label>
                      <input type="text" className="form-control form-control-sm" placeholder="Полное ФИО заявителя" value={calcData.individualName} onChange={e => setCalcData({...calcData, individualName: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ПАСПОРТНЫЕ ДАННЫЕ</label>
                      <input type="text" className="form-control form-control-sm" placeholder="Серия, номер, кем и когда выдан" value={calcData.passportData} onChange={e => setCalcData({...calcData, passportData: e.target.value})} />
                    </div>
                  </div>
                )}
              </div>

              {/* Блок 2: Договорные параметры и контакты */}
              <div>
                <h6 style={{ fontWeight: 600, color: '#475569', marginBottom: 12, fontSize: 14 }}>2. Договорные параметры и контакты</h6>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1.5fr', gap: 12 }}>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>НОМЕР ДОГОВОРА</label>
                    <input type="text" className="form-control form-control-sm" placeholder="РОССЕТИ-ТП-2026-..." value={calcData.contractNumber} onChange={e => setCalcData({...calcData, contractNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>СРОК ДЕЙСТВИЯ (МЕС)</label>
                    <input type="number" className="form-control form-control-sm" placeholder="12" value={calcData.warrantyMonths} onChange={e => setCalcData({...calcData, warrantyMonths: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>НОМЕР ТЕЛЕФОНА</label>
                    <input type="text" className="form-control form-control-sm" placeholder="+7 (___) ___-__-__" value={calcData.phone} onChange={e => setCalcData({...calcData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>EMAIL СВЯЗИ</label>
                    <input type="email" className="form-control form-control-sm" placeholder="mail@example.ru" value={calcData.email} onChange={e => setCalcData({...calcData, email: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Блок 3: Спецификация объекта подключения */}
              <div>
                <h6 style={{ fontWeight: 600, color: '#475569', marginBottom: 12, fontSize: 14 }}>3. Технические параметры объекта и стоимость</h6>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr 1.5fr', gap: 12 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>АДРЕС ОБЪЕКТА ПОДКЛЮЧЕНИЯ</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Укажите точный адрес объекта" value={calcData.address} onChange={e => setCalcData({...calcData, address: e.target.value})} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>КАДАСТРОВЫЙ НОМЕР УЧАСТКА</label>
                    <input type="text" className="form-control form-control-sm" placeholder="56:44:0000000:00" value={calcData.cadastralNumber} onChange={e => setCalcData({...calcData, cadastralNumber: e.target.value})} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ПИТАЮЩАЯ ПОДСТАНЦИЯ</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Напр. ПС Южная" value={calcData.sourceSubstation} onChange={e => setCalcData({...calcData, sourceSubstation: e.target.value})} />
                  </div>

                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>МОЩНОСТЬ (КВТ)</label>
                    <input type="number" className="form-control form-control-sm" placeholder="Напр. 15" value={calcData.powerRequested} onChange={e => setCalcData({...calcData, powerRequested: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>НАПРЯЖЕНИЕ</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Напр. 0.4 кВ" value={calcData.voltageLevel} onChange={e => setCalcData({...calcData, voltageLevel: e.target.value})} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>КАТЕГОРИЯ НАДЕЖНОСТИ</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Напр. III категория" value={calcData.reliabilityClass} onChange={e => setCalcData({...calcData, reliabilityClass: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>СЧЕТЧИК (РУБ)</label>
                    <input type="number" className="form-control form-control-sm" placeholder="Сумма" value={calcData.meterCost} onChange={e => setCalcData({...calcData, meterCost: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>СМР РАБОТЫ (РУБ)</label>
                    <input type="number" className="form-control form-control-sm" placeholder="Сумма" value={calcData.workCost} onChange={e => setCalcData({...calcData, workCost: e.target.value})} />
                  </div>
                </div>
              </div>

            </div>

            {/* Калькулятор и итоговые действия внизу карточки */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 20, marginTop: 25, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginRight: 10 }}>Итоговая расчетная стоимость техприсоединения:</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}>{totalCost.toLocaleString('ru-RU')} руб.</span>
                <span style={{ fontSize: 12, color: '#64748B', marginLeft: 15 }}>(в т.ч. НДС 20%: {vatCost.toLocaleString('ru-RU')} руб.)</span>
              </div>

              <div style={{ display: 'flex', gap: 12, width: '450px' }}>
                <button onClick={() => setActiveDoc('contract')} className="btn btn-success btn-sm w-100" style={{ fontWeight: 600, background: '#10B981', border: 'none', height: '38px' }}>
                  📜 Сформировать Договор ТП
                </button>
                <button onClick={() => setActiveDoc('order')} className="btn btn-dark btn-sm w-100" style={{ fontWeight: 600, height: '38px' }}>
                  ⚙️ Сформировать Наряд РЭС
                </button>
              </div>
            </div>
          </div>

          {/* Изоляция окна печати браузера */}
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-modal-overlay { background: transparent !important; position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
              .print-document, .print-document * { visibility: visible; }
              .print-document { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; padding: 0mm !important; }
              .d-print-none { display: none !important; }
            }
          `}</style>

          {/* МОДАЛЬНЫЙ ПРОСМОТР БЛАНКА 1: ДОГОВОР ТП */}
          {activeDoc === 'contract' && (
            <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center', overflowY: 'auto', padding: '20px 0' }}>
              <div className="print-document" style={{ background: '#fff', width: '100%', maxWidth: '800px', height: 'fit-content', padding: '45px 55px', color: '#000', borderRadius: 4, fontFamily: 'Times New Roman, serif', fontSize: '14px', textAlign: 'justify', lineHeight: '1.4' }}>

                <div className="d-print-none" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25, borderBottom: '1px solid #E2E8F0', paddingBottom: 15, fontFamily: 'sans-serif' }}>
                  <button onClick={handlePrint} className="btn btn-primary btn-sm">🖨️ Запустить печать</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleApproveAndSend('Договор')} className="btn btn-success btn-sm" style={{ background: '#10B981', border: 'none' }}>
                      ✓ Утвердить и отправить данные
                    </button>
                    <button onClick={() => setActiveDoc(null)} className="btn btn-danger btn-sm">Закрыть</button>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <strong style={{ fontSize: '15px' }}>ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО «РОССЕТИ ВОЛГА»</strong><br />
                  <span style={{ fontSize: '13px' }}>ФИЛИАЛ «ОРЕНБУРГЭНЕРГО»</span>
                  <h4 style={{ fontWeight: 'bold', marginTop: 15, fontSize: '16px' }}>ДОГОВОР ТЕХНОЛОГИЧЕСКОГО ПРИСОЕДИНЕНИЯ № {calcData.contractNumber || '___________'}</h4>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontWeight: 'bold' }}>
                  <span>г. Оренбург</span>
                  <span>«{new Date().toLocaleDateString('ru-RU')}» г.</span>
                </div>

                <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                  <strong>Публичное акционерное общество «Россети Волга»</strong>, в лице директора филиала «Оренбургэнерго» <strong>Кажаева В.Ф.</strong>, действующего на основании Генеральной доверенности, именуемое в дальнейшем <strong>«Сетевая организация»</strong>, с одной стороны, и{' '}
                  {isOrganization ? (
                    <>юридическое лицо <strong>{calcData.clientName || '________________'}</strong>, в лице ({calcData.directorTitle || '___________'}) <strong>{calcData.directorName || '________________'}</strong>, действующего на основании Устава,</>
                  ) : (
                    <>гражданин(ка) <strong>{calcData.individualName || '________________'}</strong>, паспортные данные: {calcData.passportData || '________________'},</>
                  )}{' '}именуемый(ая) в дальнейшем <strong>«Заявитель»</strong>, с другой стороны, заключили настоящий Договор о нижеследующем:
                </p>

                <h5 style={{ fontWeight: 'bold', fontSize: '14px', margin: '15px 0 5px 0' }}>I. ПРЕДМЕТ ДОГОВОРА</h5>
                <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                  1.1. Сетевая организация принимает на себя обязательства по реализации комплекса организационно-технических мероприятий по технологическому присоединению энергопринимающих устройств Заявителя на объекте: <strong>{calcData.address || '________________'}</strong> (кадастровый номер участка: {calcData.cadastralNumber || '___'}).
                </p>
                <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                  1.2. Технические параметры техприсоединения составляют: запрашиваемая мощность — <strong>{calcData.powerRequested || '___'} кВт</strong>; уровень напряжения — <strong>{calcData.voltageLevel || '___'}</strong>; категория надежности — <strong>{calcData.reliabilityClass || '___'}</strong>. Срок выполнения мероприятий — {calcData.warrantyMonths || '___'} мес.
                </p>

                <h5 style={{ fontWeight: 'bold', fontSize: '14px', margin: '15px 0 5px 0' }}>II. СТОИМОСТЬ И ПОРЯДОК РАСЧЕТОВ</h5>
                <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                  2.1. Размер платы за технологическое присоединение рассчитывается на основании утвержденных тарифных ставок и составляет <strong>{totalCost.toLocaleString('ru-RU')} рублей 00 копеек</strong>, включая НДС 20% в размере {vatCost.toLocaleString('ru-RU')} рублей.
                </p>

                <div style={{ marginTop: 45, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, fontSize: '13px', borderTop: '1px solid #000', paddingTop: 15 }}>
                  <div>
                    <strong>СЕТЕВАЯ ОРГАНИЗАЦИЯ:</strong>
                    <p style={{ margin: '5px 0' }}>Филиал ПАО «Россети Волга» - «Оренбургэнерго»</p>
                    <p style={{ marginTop: 35 }}>__________________ / Кажаева В.Ф. /</p>
                  </div>
                  <div>
                    <strong>ЗАЯВИТЕЛЬ:</strong>
                    <p style={{ margin: '5px 0' }}>{isOrganization ? calcData.clientName : calcData.individualName}</p>
                    <p style={{ marginTop: 35 }}>__________________ / __________________ /</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* МОДАЛЬНЫЙ ПРОСМОТР БЛАНКА 2: НАРЯД-ЗАДАНИЕ РЭС */}
          {activeDoc === 'order' && (
            <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center', overflowY: 'auto', padding: '20px 0' }}>
              <div className="print-document" style={{ background: '#fff', width: '100%', maxWidth: '800px', height: 'fit-content', padding: '45px 55px', color: '#000', borderRadius: 4, fontFamily: 'Arial, sans-serif', fontSize: '13px' }}>

                <div className="d-print-none" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25, borderBottom: '1px solid #E2E8F0', paddingBottom: 15 }}>
                  <button onClick={handlePrint} className="btn btn-primary btn-sm">🖨️ Запустить печать</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleApproveAndSend('Наряд')} className="btn btn-success btn-sm" style={{ background: '#10B981', border: 'none' }}>
                      ✓ Направить наряд в производство РЭС
                    </button>
                    <button onClick={() => setActiveDoc(null)} className="btn btn-danger btn-sm">Закрыть</button>
                  </div>
                </div>

                <div style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold', color: '#10B981', letterSpacing: '0.5px' }}>
                  ПАО «РОССЕТИ ВОЛГА» · ОРЕНБУРГСКИЕ ЭЛЕКТРИЧЕСКИЕ СЕТИ
                </div>

                <h4 style={{ marginTop: 15, fontWeight: 'bold', textAlign: 'center' }}>НАРЯД-ЗАДАНИЕ НА ПРОИЗВОДСТВО РАБОТ ТП</h4>

                <table className="table table-bordered mt-3" style={{ fontSize: '13px' }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 'bold', width: '30%', backgroundColor: '#F8FAFC' }}>Заявитель</td>
                      <td>{isOrganization ? calcData.clientName : calcData.individualName}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', backgroundColor: '#F8FAFC' }}>Адрес / Кадастровый №</td>
                      <td>{calcData.address} (КН: {calcData.cadastralNumber})</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', backgroundColor: '#F8FAFC' }}>Электротехнические данные</td>
                      <td>Мощность: {calcData.powerRequested} кВт | Напряжение: {calcData.voltageLevel} | Категория: {calcData.reliabilityClass}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', backgroundColor: '#F8FAFC' }}>Питающий сетевой узел</td>
                      <td>{calcData.sourceSubstation || 'Определяется диспетчером РЭС'}</td>
                    </tr>
                  </tbody>
                </table>

                <h5 style={{ fontWeight: 'bold', marginTop: 20 }}>ПРОИЗВОДСТВЕННЫЙ РЕГЛАМЕНТ ДЛЯ БРИГАДЫ РЭС:</h5>
                <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                  <li>Выполнить монтаж шкафа коммерческого учета (ШУ) на границе балансовой принадлежности. Выделенный бюджет оборудования: {calcData.meterCost || '0'} руб.</li>
                  <li>Произвести прокладку ответвления изолированным проводом СИП требуемого сечения до объекта. Выделенный бюджет СМР: {calcData.workCost || '0'} руб.</li>
                  <li>Проверить сопротивление растеканию контура повторного заземления. Составить Акт допуска узла учета в эксплуатацию и установить пломбы.</li>
                </ol>

                <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div>
                    <p><strong>Задание выдал:</strong><br />Инженер производственно-технического отдела РЭС</p>
                    <p style={{ marginTop: 15 }}>Подпись: _________________ / {user?.name || 'Оператор системы'} /</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#6B7A8D' }}>Дата автоматической генерации: {new Date().toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default ConnectServicePage