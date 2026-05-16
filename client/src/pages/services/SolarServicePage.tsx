import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const SolarServicePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Управление открытием конкретного документа: 'contract' | 'order' | null
  const [activeDoc, setActiveDoc] = useState<'contract' | 'order' | null>(null)

  // Данные для калькуляции ТУ на микрогенерацию
  const [calcData, setCalcData] = useState({
    clientName: 'Иванов Петр Сергеевич',
    passportData: 'Серия 53 14 № 401255, выдан УМВД России по Оренбургской обл., 14.05.2016 г.',
    address: 'г. Оренбург, СНТ "Мир", уч. 45',
    cadastralNumber: '56:44:0201003:245',
    solarPower: '12',
    contractNumber: 'РОССЕТИ-МГ-2026-008',
    inverterModel: 'SmartWatt Hybrid 15K',
    meterCost: '18500',
    workCost: '26500'
  })

  const totalCost = Number(calcData.meterCost) + Number(calcData.workCost)
  const vatCost = Math.round(totalCost * 0.20) // НДС 20%
  const pureCost = totalCost - vatCost

  const handlePrint = () => {
    window.print()
  }

  const handleApproveAndSend = async (docType: 'Договор' | 'Наряд') => {
    try {
      // ИСПОЛЬЗУЕМ КОРРЕТНЫЙ ЭНДПОИНТ ДЛЯ ВЗАИМОДЕЙСТВИЯ С BACKEND-РОУТЕРОМ ЗАЯВОК
      await api.post('/service-requests/solar/approve', { ...calcData, docType })
      alert(`${docType} по микрогенерации успешно зарегистрирован в АСУ "Техприсоединение" и передан в производство!`)
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

        {/* Хлебные крошки и навигация */}
        <div className="d-print-none" style={{ marginBottom: 15 }}>
          <button
            onClick={() => navigate('/contracts')}
            style={{ background: 'none', border: 'none', color: '#0057A8', cursor: 'pointer', fontWeight: 500, padding: 0 }}
          >
            ← Вернуться в панель договоров
          </button>
        </div>

        {/* Шапка регламента */}
        <div className="d-print-none" style={{ background: '#0057A8', color: '#fff', padding: '24px', borderRadius: 10, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>☀️</span>
            <div>
              <h4 style={{ margin: 0, fontWeight: 600 }}>Технологическая карта: Солнечные панели и микрогенерация</h4>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: 13 }}>
                Инженерный регламент допуска объектов микрогенерации (до 15 кВт) · ПАО «Россети Волга» — «Оренбургэнерго»
              </p>
            </div>
          </div>
        </div>

        {/* ОСНОВНОЙ КОНТЕНТ: ТЕХНИЧЕСКИЙ РЕГЛАМЕНТ ДЛЯ СОТРУДНИКА */}
        <div className="d-print-none" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 20, marginBottom: 24 }}>

          {/* Левая колонка: Инструкции и требования */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', padding: 20 }}>
            <h5 style={{ fontWeight: 600, color: '#1A2B3C', borderBottom: '2px solid #F0F4F8', paddingBottom: 8, marginBottom: 15 }}>
              📋 Производственные требования к ТУ
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, lineHeight: '1.5' }}>
              <div>
                <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>1. Проверка сетевого инвертора (Островковый режим)</strong>
                <span style={{ color: '#445566' }}>
                  Обязательно проверить наличие заводского сертификата соответствия инвертора требованиям <strong>ГОСТ Р 55709-2013</strong>.
                  Принудительное время отключения инвертора при потере внешнего питания 0.4 кВ не должно превышать <strong>0.5 секунд</strong> для обеспечения безопасности ремонтных бригад на ЛЭП.
                </span>
              </div>

              <div>
                <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>2. Требования к коммерческому учету</strong>
                <span style={{ color: '#445566' }}>
                  Монтируется исключительно двунаправленный интеллектуальный прибор учета (трансформаторного или прямого включения) типа <strong>Миртек-32-РУ</strong> или <strong>Меркурий-234</strong> с интегрированным GSM/RF-модулем для передачи профиля мощности в АСКУЭ филиала.
                </span>
              </div>

              <div>
                <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>3. Спецтехника и СИЗ бригады</strong>
                <span style={{ color: '#445566' }}>
                  • Передвижная лаборатория РЗА для проверки релейных защит.<br />
                  • Диэлектрический инструмент, штанги проверки совпадения фаз, переносные заземления.<br />
                  • Спецоборудование: Анализатор качества электроэнергии «Энергомонитор-3.3».
                </span>
              </div>
            </div>
          </div>

          {/* Правая колонка: Интерактивный Сметный калькулятор */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h5 style={{ fontWeight: 600, color: '#1A2B3C', borderBottom: '2px solid #F0F4F8', paddingBottom: 8, marginBottom: 15 }}>
                📊 Параметры ТУ и Сметы
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ЗАЯВИТЕЛЬ</label>
                  <input type="text" value={calcData.clientName} onChange={e => setCalcData({...calcData, clientName: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ПАСПОРТНЫЕ ДАННЫЕ</label>
                  <input type="text" value={calcData.passportData} onChange={e => setCalcData({...calcData, passportData: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>МОЩНОСТЬ СОЛНЕЧНЫХ ПАНЕЛЕЙ (КВТ)</label>
                  <input type="number" value={calcData.solarPower} onChange={e => setCalcData({...calcData, solarPower: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>МОДЕЛЬ СЕТЕВОГО ИНВЕРТОРА</label>
                  <input type="text" value={calcData.inverterModel} onChange={e => setCalcData({...calcData, inverterModel: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>СЧЕТЧИК (РУБ)</label>
                    <input type="number" value={calcData.meterCost} onChange={e => setCalcData({...calcData, meterCost: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>РАБОТЫ СМР (РУБ)</label>
                    <input type="number" value={calcData.workCost} onChange={e => setCalcData({...calcData, workCost: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14, marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1A2B3C' }}>Итоговая стоимость ТУ:</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#2E7D32' }}>{totalCost.toLocaleString('ru-RU')} руб.</span>
              </div>

              {/* Две раздельные кнопки генерации документов */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => setActiveDoc('contract')}
                  style={{ width: '100%', background: '#0057A8', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  📜 Создать официальный Договор ТП
                </button>
                <button
                  onClick={() => setActiveDoc('order')}
                  style={{ width: '100%', background: '#E67E22', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  ⚙️ Создать Заявление-Наряд для РЭС
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Общий контейнер стилей для печатных форм */}
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
        {/* ОКНО ПЕЧАТИ ДОКУМЕНТА 1: ОФИЦИАЛЬНЫЙ ДОГОВОР ТП (РАЗВЕРНУТЫЙ)          */}
        {/* ====================================================================== */}
        {activeDoc === 'contract' && (
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
                  🖨️ Запустить печать Договора
                </button>
                <button onClick={() => setActiveDoc(null)} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Закрыть бланк
                </button>
              </div>

              {/* Тело официального договора */}
              <div style={{ textAlign: 'center', marginBottom: 25 }}>
                <h4 style={{ fontWeight: 'bold', margin: 0, fontSize: 14, textTransform: 'uppercase' }}>
                  Публичное акционерное общество «Россети Волга»
                </h4>
                <h5 style={{ fontWeight: 'bold', margin: '4px 0 0 0', fontSize: 13 }}>
                  Филиал ПАО «Россети Волга» — «Оренбургэнерго»
                </h5>
                <div style={{ height: '1.5px', backgroundColor: '#000', width: '100%', marginTop: '8px', marginBottom: 15 }}></div>
                <h3 style={{ fontWeight: 'bold', marginTop: 15, fontSize: 16, textTransform: 'uppercase' }}>
                  ДОГОВОР № {calcData.contractNumber}
                </h3>
                <h4 style={{ fontWeight: 'bold', margin: '4px 0 0 0', fontSize: 13 }}>
                  об осуществлении технологического присоединения объекта микрогенерации
                </h4>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontWeight: 'bold' }}>
                <span>г. Оренбург</span>
                <span>«{new Date().toLocaleDateString('ru-RU')}» г.</span>
              </div>

              <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                Публичное акционерное общество <strong>«Россети Волга»</strong>, в лице директора филиала «Оренбургэнерго» <strong>Кажаева Виктора Федоровича</strong>, действующего на основании Доверенности № 56-АА/2025-11 от 12.12.2025 г., именуемое в дальнейшем <strong>«Сетевая организация»</strong>, с одной стороны, и гражданин Российской Федерации <strong>{calcData.clientName}</strong>, passportные данные: {calcData.passportData}, именуемый в дальнейшем <strong>«Заявитель»</strong>, с другой стороны, совместно именуемые «Стороны», заключили настоящий Договор на основании Федерального закона № 471-ФЗ «О внесении изменений в Федеральный закон "Об электроэнергетике" в части развития микрогенерации» о нижеследующем:
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>1. ПРЕДМЕТ ДОГОВОРА</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                1.1. Сетевая организация принимает на себя обязательства по осуществлению технологического присоединения энергопринимающих устройств Заявителя, сопряженных с <strong>объектом микрогенерации (солнечной электростанцией)</strong>, установленной мощностью <strong>{calcData.solarPower} кВт</strong>, с применением инверторного оборудования общего назначения марки <u>{calcData.inverterModel}</u>.
              </p>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                1.2. Место нахождения объекта микрогенерации: {calcData.address}, кадастровый номер земельного участка: {calcData.cadastralNumber}. Выдача мощности предусматривается в распределительную сеть низкого напряжения 0.4 кВ Оренбургского РЭС.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>2. ОБЯЗАННОСТИ СТОРОН И ТЕХНИЧЕСКИЕ УСЛОВИЯ</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                2.1. Сетевая организация обязуется выполнить проверку схемы выдачи мощности, установить двунаправленный прибор учета с удаленным сбором данных, осуществить фактическое присоединение и подать напряжение на объект.
              </p>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                2.2. Заявитель обязуется обеспечить полную готовность генерирующего оборудования, включая настройку автоматического защитного реле инвертора для мгновенного отключения от сети при исчезновении в ней напряжения (защита от островкового режима работы по ГОСТ Р 55709-2013).
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>3. ПЛАТА ЗА ТЕХНОЛОГИЧЕСКОЕ ПРИСОЕДИНЕНИЕ И РАСЧЕТЫ</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                3.1. Размер платы за технологическое присоединение по настоящему Договору рассчитывается на основании стандартизированных тарифных ставок и составляет: <strong>{totalCost.toLocaleString('ru-RU')} рублей 00 копеек</strong>, в том числе:
              </p>
              <ul style={{ margin: '0 0 8px 25px', padding: 0 }}>
                <li>Стоимость измерительного комплекса (Миртек/Меркурий): {Number(calcData.meterCost).toLocaleString('ru-RU')} руб.</li>
                <li>Стоимость пусконаладочных работ и проверки защит РЗА: {Number(calcData.workCost).toLocaleString('ru-RU')} руб.</li>
              </ul>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                3.2. Сумма без НДС: {pureCost.toLocaleString('ru-RU')} руб. Сумма НДС (20%): {vatCost.toLocaleString('ru-RU')} руб. Оплата производится Заявителем в течение 5 банковских дней со дня подписания актов.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>4. ОТВЕТСТВЕННОСТЬ СТОРОН И ФОРС-МАЖОР</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                4.1. За неисполнение или ненадлежащее исполнение обязательств Стороны несут ответственность в соответствии с действующим законодательством РФ. За задержку выполнения мероприятий виновная сторона уплачивает неустойку в размере 0.01% от общей суммы договора за каждый день просрочки.
              </p>

              {/* Реквизиты и подписи сторон */}
              <div style={{ marginTop: 35, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, fontSize: 11, borderTop: '1px solid #000', paddingTop: 15 }}>
                <div>
                  <h6 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: 11 }}>СЕТЕВАЯ ОРГАНИЗАЦИЯ:</h6>
                  <p style={{ margin: '2px 0' }}><strong>Филиал ПАО «Россети Волга» — «Оренбургэнерго»</strong></p>
                  <p style={{ margin: '2px 0' }}>Адрес: 460024, г. Оренбург, ул. Маршала Жукова, д. 44</p>
                  <p style={{ margin: '2px 0' }}>ИНН 6450014147 / КПП 561202001</p>
                  <p style={{ marginTop: 25 }}>Директор филиала: ___________ / Кажаев В.Ф. /</p>
                  <p style={{ fontSize: 9, color: '#777' }}>[М.П. Службы техприсоединения]</p>
                </div>
                <div>
                  <h6 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: 11 }}>ЗАЯВИТЕЛЬ:</h6>
                  <p style={{ margin: '2px 0' }}><strong>Физ. лицо: {calcData.clientName}</strong></p>
                  <p style={{ margin: '2px 0' }}>Паспорт: {calcData.passportData}</p>
                  <p style={{ margin: '2px 0' }}>Адрес регистрации: {calcData.address}</p>
                  <p style={{ marginTop: 45 }}>Подпись гражданина: _______________________</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* ОКНО ПЕЧАТИ ДОКУМЕНТА 2: ЗАЯВЛЕНИЕ-НАРЯД НА ПРОИЗВОДСТВО РАБОТ ДЛЯ РЭС   */}
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
                  🖨️ Запустить печать Наряда в РЭС
                </button>
                <button onClick={() => setActiveDoc(null)} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Закрыть бланк
                </button>
              </div>

              {/* Тело наряда */}
              <div style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 'bold', color: '#444', letterSpacing: '0.5px' }}>
                ПАО «РОССЕТИ ВОЛГА» · ПРОИЗВОДСТВЕННОЕ ОТДЕЛЕНИЕ ОРЕНБУРГСКИЕ ЭЛЕКТРИЧЕСКИЕ СЕТИ
              </div>

              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: 15 }}>ВНУТРЕННИЙ ЗАЯВЛЕНИЕ-НАРЯД № МГ-{calcData.contractNumber.split('-')[3]}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 11, fontWeight: 'bold' }}>на проведение комплексных пусконаладочных работ в узле микрогенерации</p>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', border: '1px solid #CBD5E1', marginBottom: 15, fontSize: 11 }}>
                <strong>Исполнитель задания:</strong> Инженерная группа службы РЗА и ИК Оренбургского РЭС<br />
                <strong>Срок исполнения регламента:</strong> 5 рабочих дней со дня регистрации текущего наряда<br />
                <strong>Основание:</strong> Заявка на технологическое присоединение № {calcData.contractNumber}
              </div>

              <h4 style={{ fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8 }}>
                I. ОБЪЕКТ И СУБЪЕКТ ИСПЫТАНИЙ
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15, fontSize: 11 }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold', width: '35%' }}>ФИО Собственника / Адрес</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{calcData.clientName} · {calcData.address}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>Номинал солнечного поля</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{calcData.solarPower} кВт (Параллельная работа со стабильной частотой 50 Гц)</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>Управляющий инвертор</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{calcData.inverterModel} (со встроенным реле контроля сетевого напряжения)</td>
                  </tr>
                </tbody>
              </table>

              <h4 style={{ fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8 }}>
                II. ПРОГРАММА ПУСКОНАЛАДОЧНЫХ РАБОТ ДЛЯ БРИГАДЫ
              </h4>
              <ol style={{ paddingLeft: '20px', margin: '0 0 15px 0', fontSize: 11, lineHeight: '1.5' }}>
                <li><strong>Проверка цепей коммерческого учета:</strong> Произвести монтаж интеллектуального двунаправленного счетчика на границе балансовой принадлежности. Проверить прохождение сигнала GSM/RF до серверов верхнего уровня АСКУЭ филиала Оренбургэнерго.</li>
                <li><strong>Тест защиты от обратной трансформации (Островковый режим):</strong> Выполнить искусственное отключение вводного автоматического выключателя 0.4 кВ со стороны сети РЭС. С помощью секундомера зафиксировать время прекращения генерации инвертора <u>{calcData.inverterModel}</u>. Максимально допустимое время отсечки по ГОСТ — 0.5 сек.</li>
                <li><strong>Анализ гармонических составляющих:</strong> Подключить прибор «Энергомонитор-3.3» к шинам генерации, снять показатели отклонения синусоидальности напряжения при пиковой инсоляции.</li>
              </ol>

              <h4 style={{ fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8 }}>
                III. ЗАКЛЮЧЕНИЕ СЛУЖБЫ ТЕХНИЧЕСКОГО КОНТРОЛЯ
              </h4>
              <p style={{ fontSize: 11, margin: '0 0 15px 0' }}>
                По результатам выполнения пунктов I и II составить двухсторонний «Акт допуска узла микрогенерации в промышленную эксплуатацию». При несоответствии времени отсечки инвертора параметрам безопасности — составить дефектную ведомость с полным запретом подачи напряжения в сеть РЭС.
              </p>

              <div style={{ marginTop: 35, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <div>
                  <p><strong>Распоряжение выдал:</strong><br />Инженер производственно-технического предела</p>
                  <p style={{ marginTop: 15 }}>Подпись: _________________ / {user?.name || 'Администратор системы'} /</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button className="d-print-none" onClick={() => handleApproveAndSend('Наряд')} style={{ background: '#2E7D32', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                    ✓ Утвердить и направить в РЭС
                  </button>
                  <p style={{ margin: '4px 0 0 0', fontSize: 10, color: '#6B7A8D' }}>Сформировано в Оренбургэнерго: {new Date().toLocaleDateString('ru-RU')}</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default SolarServicePage