import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const PowerShareServicePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Управление открытием конкретного документа: 'agreement' | 'order' | null
  const [activeDoc, setActiveDoc] = useState<'agreement' | 'order' | null>(null)

  // Данные для калькуляции и генерации документов перераспределения
  const [calcData, setCalcData] = useState({
    donorName: 'ООО "Механический завод"',
    donorInn: '5610044122 / КПП 561001001',
    recipientName: 'ИП Сидоров В.В. (Автосервис)',
    recipientInn: '560908877110',
    address: 'г. Оренбург, проезд Автоматики, д. 12',
    cadastralNumber: '56:44:0301002:88',
    reallocatedPower: '50', // кВт для передачи
    contractNumber: 'РОССЕТИ-ПЕР-2026-077',
    substationName: 'ПС 110/10 кВ "Пригородная" (Фидер 10 кВ №12, ТП-704)',
    adminFee: '12500', // Стоимость переоформления документов
    inspectionCost: '8000' // Выезд инженера для замера нагрузки и опломбировки
  })

  const totalCost = Number(calcData.adminFee) + Number(calcData.inspectionCost)
  const vatCost = Math.round(totalCost * 0.20) // НДС 20%
  const pureCost = totalCost - vatCost

  const handlePrint = () => {
    window.print()
  }

  const handleApproveAndSend = async (docType: 'Соглашение' | 'Распоряжение') => {
    try {
      // ИСПОЛЬЗУЕМ ОБНОВЛЕННЫЙ ЭНДПОИНТ НА БЭКЕНДЕ
      await api.post('/service-requests/powershare/approve', { ...calcData, docType })
      alert(`${docType} успешно проведено в АСУ "Учет договоров ТП" и передано в абонентский отдел ЕРЦ!`)
      setActiveDoc(null)
    } catch (err) {
      console.error(err)
      alert(`Ошибка проведения документа на бэкенде. Проверьте соединение с сервером.`)
      setActiveDoc(null)
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ background: '#F0F4F8', minHeight: '100vh', padding: '14px 8px', margin: '0 100px' }}>

        {/* Навигация */}
        <div className="d-print-none" style={{ marginBottom: 15 }}>
          <button
            onClick={() => navigate('/contracts')}
            style={{ background: 'none', border: 'none', color: '#0057A8', cursor: 'pointer', fontWeight: 500, padding: 0 }}
          >
            ← Вернуться в панель договоров
          </button>
        </div>

        {/* Шапка регламента */}
        <div style={{ background: '#445566', color: '#fff', padding: '24px', borderRadius: 10, marginBottom: 20 }} className="d-print-none">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>🔄</span>
            <div>
              <h4 style={{ margin: 0, fontWeight: 600 }}>Технологическая карта: Перераспределение мощности</h4>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: 13 }}>
                Регламент переоформления величины разрешенной мощности между потребителями в рамках одного центра питания · «Оренбургэнерго»
              </p>
            </div>
          </div>
        </div>

        {/* ИНСТРУКЦИИ ДЛЯ ПЕРСОНАЛА И КАЛЬКУЛЯТОР */}
        <div className="d-print-none" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 20, marginBottom: 24 }}>

          {/* Левая колонка: Инженерный протокол */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', padding: 20 }}>
            <h5 style={{ fontWeight: 600, color: '#1A2B3C', borderBottom: '2px solid #F0F4F8', paddingBottom: 8, marginBottom: 15 }}>
              📝 Инженерный протокол оценки сети
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, lineHeight: '1.5' }}>
              <div>
                <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>1. Анализ фактического потребления Донора</strong>
                <span style={{ color: '#445566' }}>
                  Перед утверждением сделки необходимо выгрузить часовые профили нагрузки Донора (<strong>{calcData.donorName}</strong>) из системы ИС «Пирамида-Сети» за последние 12 календарных месяцев. Убедиться, что отчуждаемая мощность в размере <strong>{calcData.reallocatedPower} кВт</strong> является избыточной и ее снижение не вызовет ложных срабатываний ограничителей мощности на стороне Донора.
                </span>
              </div>

              <div>
                <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>2. Проверка пропускной способности фидера и КТП</strong>
                <span style={{ color: '#445566' }}>
                  Оценить техническую возможность переноса точки присоединения нагрузки в пределах <u>{calcData.substationName}</u>. Перераспределение не должно вызывать несимметрии токов в фазах головного трансформатора и падения уровней напряжения у смежных потребителей ниже критериев ГОСТ 32144-2013.
                </span>
              </div>

              <div>
                <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>3. Модернизация и переопломбировка узлов учета</strong>
                <span style={{ color: '#445566' }}>
                  Организовать выезд инспекционной бригады РЭС для проверки измерительных комплексов обеих сторон. При необходимости — выдать предписание на замену трансформаторов тока (ТТ) под новые уменьшенные/увеличенные номинальные токи нагрузок с последующей установкой контрольных роторных пломб.
                </span>
              </div>
            </div>
          </div>

          {/* Правая колонка: Калькулятор параметров */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h5 style={{ fontWeight: 600, color: '#1A2B3C', borderBottom: '2px solid #F0F4F8', paddingBottom: 8, marginBottom: 15 }}>
                📊 Параметры сделки и Пошлины
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ПОТРЕБИТЕЛЬ-ДОНОР</label>
                  <input type="text" value={calcData.donorName} onChange={e => setCalcData({...calcData, donorName: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ИНН / КПП ДОНОРА</label>
                  <input type="text" value={calcData.donorInn} onChange={e => setCalcData({...calcData, donorInn: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ПОТРЕБИТЕЛЬ-ПРИНИМАЮЩИЙ</label>
                  <input type="text" value={calcData.recipientName} onChange={e => setCalcData({...calcData, recipientName: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ОТЧУЖДАЕМАЯ P (КВТ)</label>
                    <input type="number" value={calcData.reallocatedPower} onChange={e => setCalcData({...calcData, reallocatedPower: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ПИТАЮЩИЙ ЦЕНТР</label>
                    <input type="text" value={calcData.substationName} onChange={e => setCalcData({...calcData, substationName: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>АДМ. СБОР (РУБ)</label>
                    <input type="number" value={calcData.adminFee} onChange={e => setCalcData({...calcData, adminFee: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ТЕХ. ИНСПЕКЦИЯ (РУБ)</label>
                    <input type="number" value={calcData.inspectionCost} onChange={e => setCalcData({...calcData, inspectionCost: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14, marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1A2B3C' }}>Итого сбор по регламенту:</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0057A8' }}>{totalCost.toLocaleString('ru-RU')} руб.</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => setActiveDoc('agreement')}
                  style={{ width: '100%', background: '#0057A8', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  📜 Создать Трехстороннее Соглашение ТП
                </button>
                <button
                  onClick={() => setActiveDoc('order')}
                  style={{ width: '100%', background: '#E67E22', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  ⚙️ Создать Распоряжение в службу учета лимитов
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Стили медиа-запросов для вывода документов на печать */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-modal-overlay { background: transparent !important; position: absolute !important; top: 0 !important; left: 0 !important; }
            .print-document, .print-document * { visibility: visible; }
            .print-document { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; padding: 0mm !important; color: #000 !important; }
            .d-print-none { display: none !important; }
          }
        `}</style>

        {/* ====================================================================== */}
        {/* ОКНО ПЕЧАТИ ДОКУМЕНТА 1: ТРЕХСТОРОННЕЕ СОГЛАШЕНИЕ О ПЕРЕРАСПРЕДЕЛЕНИИ     */}
        {/* ====================================================================== */}
        {activeDoc === 'agreement' && (
          <div className="print-modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center',
            overflowY: 'auto', padding: '20px 0'
          }}>
            <div className="print-document" style={{
              background: '#fff', width: '100%', maxWidth: '850px', height: 'fit-content',
              padding: '50px 60px', color: '#000', borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              fontFamily: 'Times New Roman, serif', fontSize: 13, lineHeight: '1.4', textAlign: 'justify'
            }}>

              <div className="d-print-none" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25, borderBottom: '1px solid #E2E8F0', paddingBottom: 15, fontFamily: 'sans-serif' }}>
                <button onClick={handlePrint} style={{ background: '#0057A8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  🖨️ Напечатать Трехстороннее Соглашение
                </button>
                <button onClick={() => setActiveDoc(null)} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Закрыть бланк
                </button>
              </div>

              {/* Заголовок */}
              <div style={{ textAlign: 'center', marginBottom: 25 }}>
                <h4 style={{ fontWeight: 'bold', margin: 0, fontSize: 13, textTransform: 'uppercase' }}>
                  Публичное акционерное общество «Россети Волга»
                </h4>
                <h5 style={{ fontWeight: 'bold', margin: '4px 0 0 0', fontSize: 12 }}>
                  Филиал ПАО «Россети Волга» — «Оренбургэнерго»
                </h5>
                <div style={{ height: '1.5px', backgroundColor: '#000', width: '100%', marginTop: '8px', marginBottom: 15 }}></div>
                <h3 style={{ fontWeight: 'bold', marginTop: 15, fontSize: 15, textTransform: 'uppercase' }}>
                  СОГЛАШЕНИЕ № {calcData.contractNumber}
                </h3>
                <h4 style={{ fontWeight: 'bold', margin: '4px 0 0 0', fontSize: 12 }}>
                  о перераспределении максимальной мощности между потребителями электрической энергии
                </h4>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontWeight: 'bold' }}>
                <span>г. Оренбург</span>
                <span>«{new Date().toLocaleDateString('ru-RU')}» г.</span>
              </div>

              <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                Филиал Публичного акционерного общества <strong>«Россети Волга» — «Оренбургэнерго»</strong>, в лице директора филиала <strong>Кажаева Виктора Федоровича</strong>, действующего на основании Доверенности № 56-АА/2025-11 от 12.12.2025 г., именуемый в дальнейшем <strong>«Сетевая организация»</strong>, с первой стороны, юридическое лицо <strong>{calcData.donorName}</strong>, ИНН/КПП: {calcData.donorInn}, именуемое в дальнейшем <strong>«Лицо, передающее мощность» (Донор)</strong>, со второй стороны, и <strong>{calcData.recipientName}</strong>, ИНН: {calcData.recipientInn}, именуемое в дальнейшем <strong>«Лицо, принимающее мощность» (Получатель)</strong>, с третьей стороны, совместно именуемые «Стороны», заключили настоящий Соглашение о нижеследующем:
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>1. ПРЕДМЕТ СОГЛАШЕНИЯ</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                1.1. В соответствии с положениями раздела IV Правил технологического присоединения (утв. Постановлением Правительства РФ № 861), Лицо, передающее мощность, добровольно отказывается от части своей величины максимальной разрешенной мощности в объеме <strong>{calcData.reallocatedPower} кВт</strong> в пользу Лица, принимающего мощность.
              </p>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                1.2. Перераспределение мощности производится в границах единого центра питания электрических сетей Сетевой организации: <u>{calcData.substationName}</u>. Адрес расположения энергопринимающих устройств объектов Сторон: {calcData.address}, Кадастровый номер земельного участка: {calcData.cadastralNumber}.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>2. ОБЯЗАТЕЛЬСТВА СТОРОН</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                2.1. Сетевая организация в течение 10 рабочих дней с момента полного выполнения технических условий и внесения регламентного сбора Сторонами обязуется осуществить переоформление разрешительной документации, выдать новые Акты об осуществлении технологического присоединения (АОТП) обеим Сторонам с фиксацией новых лимитов мощности.
              </p>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                2.2. Стороны обязуется за свой счет и силами специализированного персонала РЭС провести технический аудит измерительных комплексов учета электроэнергии, скорректировать параметры вводных автоматических выключателей и обеспечить допуск инспектора для установки контрольных пломб.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>3. СТОИМОСТЬ И УСЛОВИЯ ОПЛАТЫ РЕГЛАМЕНТНЫХ ПРОЦЕДУР</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                3.1. Нормативная стоимость выполнения процедур переоформления документов и проведения инспекционного выезда составляет: <strong>{totalCost.toLocaleString('ru-RU')} рублей 00 копеек</strong>, в том числе:
              </p>
              <ul style={{ margin: '0 0 8px 25px', padding: 0 }}>
                <li>Административно-технический сбор за переоформление ТУ и АОТП: {Number(calcData.adminFee).toLocaleString('ru-RU')} руб.</li>
                <li>Инспекционный выезд инженера ПО для обследования и опломбировки: {Number(calcData.inspectionCost).toLocaleString('ru-RU')} руб.</li>
              </ul>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                3.2. Сумма чистой стоимости услуг без учета налогов: {pureCost.toLocaleString('ru-RU')} руб. Сумма НДС (20%): {vatCost.toLocaleString('ru-RU')} руб.
              </p>

              {/* Блок подписей сторон в три колонки */}
              <div style={{ marginTop: 35, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, fontSize: 10, borderTop: '1px solid #000', paddingTop: 15 }}>
                <div>
                  <h6 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: 10 }}>1. СЕТЕВАЯ ОРГАНИЗАЦИЯ:</h6>
                  <p style={{ margin: '2px 0' }}><strong>Филиал ПАО «Россети Волга» — «Оренбургэнерго»</strong></p>
                  <p style={{ margin: '2px 0' }}>ул. Маршала Жукова, д. 44</p>
                  <p style={{ marginTop: 30 }}>__________ / Кажаев В.Ф. /</p>
                </div>
                <div>
                  <h6 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: 10 }}>2. ЛИЦО ПЕРЕДАЮЩЕЕ (ДОНОР):</h6>
                  <p style={{ margin: '2px 0' }}><strong>{calcData.donorName}</strong></p>
                  <p style={{ margin: '2px 0' }}>ИНН: {calcData.donorInn.split('/')[0]}</p>
                  <p style={{ marginTop: 44 }}>_______________________</p>
                </div>
                <div>
                  <h6 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: 10 }}>3. ЛИЦО ПРИНИМАЮЩЕЕ:</h6>
                  <p style={{ margin: '2px 0' }}><strong>{calcData.recipientName}</strong></p>
                  <p style={{ margin: '2px 0' }}>ИНН: {calcData.recipientInn}</p>
                  <p style={{ marginTop: 44 }}>_______________________</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* ОКНО ПЕЧАТИ ДОКУМЕНТА 2: РАСПОРЯЖЕНИЕ В СЛУЖБУ УЧЕТА И ЛИМИТОВ         */}
        {/* ====================================================================== */}
        {activeDoc === 'order' && (
          <div className="print-modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center',
            overflowY: 'auto', padding: '20px 0'
          }}>
            <div className="print-document" style={{
              background: '#fff', width: '100%', maxWidth: '850px', height: 'fit-content',
              padding: '50px 60px', color: '#000', borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              fontFamily: 'Arial, sans-serif', fontSize: 12, lineHeight: '1.4'
            }}>

              <div className="d-print-none" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25, borderBottom: '1px solid #E2E8F0', paddingBottom: 15 }}>
                <button onClick={handlePrint} style={{ background: '#E67E22', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  🖨️ Напечатать Внутреннее Распоряжение
                </button>
                <button onClick={() => setActiveDoc(null)} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Закрыть бланк
                </button>
              </div>

              {/* Тело производственного распоряжения */}
              <div style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 'bold', color: '#444' }}>
                ПАО «РОССЕТИ ВОЛГА» · ОРЕНБУРГСКИЕ ЭЛЕКТРИЧЕСКИЕ СЕТИ · СЛУЖБА БАЛАНСОВ И УЧЕТА ЭЛЕКТРОЭНЕРГИИ
              </div>

              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: 14 }}>ВНУТРЕННЕЕ РАСПОРЯЖЕНИЕ № Р-ПЕР-{calcData.contractNumber.split('-')[3]}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 11, fontWeight: 'bold' }}>Об изменении лимитов разрешенной мощности в автоматизированных информационных системах и базах данных</p>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', border: '1px solid #CBD5E1', marginBottom: 15, fontSize: 11 }}>
                <strong>Кому:</strong> Начальнику отдела балансов, транспорта и биллинга электроэнергии Центрального ПО<br />
                <strong>Основание для корректировки базы данных:</strong> Зарегистрированное трехстороннее соглашение № {calcData.contractNumber}<br />
                <strong>Центр распределения нагрузок:</strong> {calcData.substationName}
              </div>

              <h4 style={{ fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8 }}>
                I. ТАБЛИЦА СКОРРЕКТИРОВАННЫХ ТЕХНИЧЕСКИХ ЛИМИТОВ ПОТРЕБЛЕНИЯ
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15, fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#F1F5F9' }}>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Потребитель / ИНН</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>Статус роли</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>Величина изменения</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Статус измерительного комплекса</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{calcData.donorName}<br /><small>{calcData.donorInn}</small></td>
                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', color: '#EF4444', fontWeight: 600 }}>Передающий (Донор)</td>
                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>- {calcData.reallocatedPower} кВт</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Требуется инструментальная проверка уставки расцепителя вводного АВ.</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{calcData.recipientName}<br /><small>ИНН: {calcData.recipientInn}</small></td>
                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>Принимающий</td>
                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>+ {calcData.reallocatedPower} кВт</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Необходима повторная параметризация профиля АСКУЭ на новый лимит.</td>
                  </tr>
                </tbody>
              </table>

              <h4 style={{ fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8 }}>
                II. ПОРУЧЕНИЯ ТЕХНИЧЕСКИМ СЛУЖБАМ ПОДРАЗДЕЛЕНИЯ
              </h4>
              <ol style={{ paddingLeft: '20px', margin: '0 0 15px 0', fontSize: 11, lineHeight: '1.5' }}>
                <li>Инженерам абонентского отдела внести изменения в карточки договоров энергоснабжения со Сторонами в течение 3 рабочих дней с даты проведения платежа.</li>
                <li>Инспекторам РЭС выехать на объект ({calcData.address}) для проверки соответствия номиналов аппаратов защиты новым техническим условиям и установки пломб ПАО «Россети Волга». Смета за выезд ({calcData.inspectionCost} руб.) распределена.</li>
              </ol>

              <div style={{ marginTop: 35, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <div>
                  <p><strong>Распоряжение выдал:</strong><br />Ведущий инженер ПТО филиала «Оренбургэнерго»</p>
                  <p style={{ marginTop: 15 }}>Подпись: _________________ / {user?.name || 'Системный программист'} /</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button className="d-print-none" onClick={() => handleApproveAndSend('Распоряжение')} style={{ background: '#E67E22', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                    ✓ Утвердить лимиты в АСКУЭ
                  </button>
                  <p style={{ margin: '4px 0 0 0', fontSize: 10, color: '#6B7A8D' }}>Системный маркер времени: {new Date().toLocaleDateString('ru-RU')}</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default PowerShareServicePage