import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const ConstructionServicePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Управление открытием конкретного документа: 'contract' | 'act' | null
  const [activeDoc, setActiveDoc] = useState<'contract' | 'act' | null>(null)

  // Данные для калькуляции СМР
  const [calcData, setCalcData] = useState({
    clientName: 'ООО "Оренбургский Логистический Центр"',
    innData: '5610229940 / КПП 561001001',
    address: 'г. Оренбург, Загородное шоссе, уч. 14/2',
    workScope: 'Строительство КЛ-10 кВ от яч. №5 ПС "Авиатор" до проектируемой КТП-10/0.4 кВ, монтаж КТП-400 кВА',
    powerRequested: '400', // Мощность объекта в кВт
    voltageLevel: '10 / 0.4 кВ',
    contractNumber: 'РОССЕТИ-СМР-2026-114',
    cableLength: '1.2', // Длина кабельной линии в км
    materialsCost: '1450000', // Стоимость силового кабеля, опор, КТП и ячеек
    installationCost: '890000' // Стоимость земляных работ, монтажа, проколов ГНБ и испытаний
  })

  const totalCost = Number(calcData.materialsCost) + Number(calcData.installationCost)
  const vatCost = Math.round(totalCost * 0.20) // НДС 20%
  const pureCost = totalCost - vatCost

  const handlePrint = () => {
    window.print()
  }

  const handleApproveAndSend = async (docType: 'Договор' | 'Акт') => {
    try {
      // ИСПОЛЬЗУЕМ ОБНОВЛЕННЫЙ ЭНДПОИНТ НА БЭКЕНДЕ
      await api.post('/service-requests/construction/approve', { ...calcData, docType })
      alert(`${docType} по капитальному строительству успешно проведен в базе ПТО и ГИС СМР!`)
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
        <div className="d-print-none" style={{ background: '#0B5394', color: '#fff', padding: '24px', borderRadius: 10, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>🏗️</span>
            <div>
              <h4 style={{ margin: 0, fontWeight: 600 }}>Технологическая карта: Строительно-монтажные работы (СМР)</h4>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: 13 }}>
                Регламент капитального строительства сетевой инфраструктуры, КЛ/ВЛ и КТП · Управление капитального строительства «Оренбургэнерго»
              </p>
            </div>
          </div>
        </div>

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <div className="d-print-none" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 20, marginBottom: 24 }}>

          {/* Левая колонка: Регламент и Строительный надзор */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', padding: 20 }}>
            <h5 style={{ fontWeight: 600, color: '#1A2B3C', borderBottom: '2px solid #F0F4F8', paddingBottom: 8, marginBottom: 15 }}>
              🚧 Производственный регламент и Технадзор
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, lineHeight: '1.5' }}>
              <div>
                <strong style={{ color: '#0B5394', display: 'block', marginBottom: 4 }}>1. Земляные работы и скрытые переходы (ГНБ)</strong>
                <span style={{ color: '#445566' }}>
                  Разработка траншей для кабельных линий <strong>{calcData.voltageLevel}</strong> должна выполняться в строгом соответствии с согласованными ордерами земляных работ. Проколы под автомобильными дорогами общего пользования осуществлять методом горизонтально-направленного бурения (ГНБ) с укладкой кабеля в ПНД-трубы повышенной прочности. Длина трассы: <strong>{calcData.cableLength} км</strong>.
                </span>
              </div>

              <div>
                <strong style={{ color: '#0B5394', display: 'block', marginBottom: 4 }}>2. Монтаж оборудования и входной контроль материалов</strong>
                <span style={{ color: '#445566' }}>
                  Все поставляемые силовые кабели (с изоляцией из сшитого полиэтилена), концевые муфты и КТП обязаны пройти процедуру входного контроля Службы снабжения с составлением актов дефектовки. Монтаж КТП выполнять на железобетонных фундаментах с обеспечением штатного заземляющего контура (сопротивление растеканию тока не более <strong>4 Ом</strong> для 10 кВ).
                </span>
              </div>

              <div>
                <strong style={{ color: '#0B5394', display: 'block', marginBottom: 4 }}>3. Высоковольтные испытания и исполнительная документация</strong>
                <span style={{ color: '#445566' }}>
                  По окончании СМР лаборатория обязана произвести испытания изоляции повышенным напряжением, проверку целостности жил и фазировку КЛ. Заявителю/подрядчику сдать в ПТО полный комплект исполнительной документации (исполнительные чертежи трассы М 1:500, акты скрытых работ на подсыпку постели и укладку сигнальной ленты).
                </span>
              </div>
            </div>
          </div>

          {/* Правая колонка: Смета капитальных затрат */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h5 style={{ fontWeight: 600, color: '#1A2B3C', borderBottom: '2px solid #F0F4F8', paddingBottom: 8, marginBottom: 15 }}>
                📊 Спецификация объемов СМР
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ЗАКАЗЧИК ОБЪЕКТА СМР</label>
                  <input type="text" value={calcData.clientName} onChange={e => setCalcData({...calcData, clientName: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ОБЪЕМ СТРОИТЕЛЬНЫХ РАБОТ</label>
                  <textarea value={calcData.workScope} onChange={e => setCalcData({...calcData, workScope: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4, height: 46, resize: 'none', fontFamily: 'sans-serif' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 8 }}>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>АДРЕС ОБЪЕКТА СТРОИТЕЛЬСТВА</label>
                    <input type="text" value={calcData.address} onChange={e => setCalcData({...calcData, address: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ПРОТЯЖЕННОСТЬ (КМ)</label>
                    <input type="number" step="0.1" value={calcData.cableLength} onChange={e => setCalcData({...calcData, cableLength: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ОБОРУДОВАНИЕ И КТП (РУБ)</label>
                    <input type="number" value={calcData.materialsCost} onChange={e => setCalcData({...calcData, materialsCost: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>МОНТАЖ И ТЕХНИКА (РУБ)</label>
                    <input type="number" value={calcData.installationCost} onChange={e => setCalcData({...calcData, installationCost: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14, marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1A2B3C' }}>Сметная стоимость (с НДС):</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0B5394' }}>{totalCost.toLocaleString('ru-RU')} руб.</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => setActiveDoc('contract')}
                  style={{ width: '100%', background: '#0B5394', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  📜 Создать Договор подряда на СМР
                </button>
                <button
                  onClick={() => setActiveDoc('act')}
                  style={{ width: '100%', background: '#E67E22', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  🚧 Акт строительного контроля объекта
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Стили для печати */}
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
        {/* ОКНО ПЕЧАТИ ДОКУМЕНТА 1: ДОГОВОР НА ПРОИЗВОДСТВО СМР                     */}
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
                <button onClick={handlePrint} style={{ background: '#0B5394', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  🖨️ Напечатать Договор СМР
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
                <h3 style={{ fontWeight: 'bold', marginTop: 15, fontSize: 14, textTransform: 'uppercase' }}>
                  ДОГОВОР ПОДРЯДА № {calcData.contractNumber}
                </h3>
                <h4 style={{ fontWeight: 'bold', margin: '4px 0 0 0', fontSize: 11 }}>
                  на выполнение строительно-монтажных работ по объекту technological присоединения
                </h4>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontWeight: 'bold' }}>
                <span>г. Оренбург</span>
                <span>«{new Date().toLocaleDateString('ru-RU')}» г.</span>
              </div>

              <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                Филиал Публичного акционерного общества <strong>«Россети Волга» — «Оренбургэнерго»</strong>, именуемый в дальнейшем <strong>«Подрядчик»</strong>, в лице директора филиала <strong>Кажаева Виктора Федоровича</strong>, действующего на основании Доверенности № 56-АА/2025-11 от 12.12.2025 г., с одной стороны, и <strong>{calcData.clientName}</strong>, ИНН/КПП: {calcData.innData}, именуемый в дальнейшем <strong>«Заказчик»</strong>, с другой стороны, заключили настоящий Договор о нижеследующем:
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>1. ПРЕДМЕТ ДОГОВОРА</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                1.1. Заказчик поручает, а Подрядчик принимает на себя обязательства по выполнению комплекса строительно-монтажных работ силами производственных отделений филиала на объекте по адресу: <u>{calcData.address}</u>.
              </p>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                1.2. Состав, содержание и объемы выполняемых строительно-монтажных работ определяются утвержденной проектно-сметной документацией и включают в себя: <u>{calcData.workScope}</u> с проектной протяженностью линейной части <strong>{calcData.cableLength} км</strong>.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>2. ПОРЯДОК ПРОИЗВОДСТВА И ПРИЕМКИ РАБОТ</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                2.1. Подрядчик обязуется обеспечить выполнение СМР в соответствии с требованиями СНиП, ПУЭ, ГОСТ и техническими регламентами таможенного союза, провести входной контроль электротехнических материалов, а также своевременно извещать технадзор Заказчика о готовности к освидетельствованию скрытых работ.
              </p>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                2.2. Сдача-приемка выполненных работ оформляется подписанием унифицированных актов по форме КС-2 и справок о стоимости работ по форме КС-3 после успешного завершения пусконаладочных испытаний и предоставления исполнительных планов.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>3. СТОИМОСТЬ РАБОТ И ПОРЯДОК РАСЧЕТОВ</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                3.1. Общая стоимость работ по настоящему Договору согласно утвержденному сметному расчету составляет: <strong>{totalCost.toLocaleString('ru-RU')} рублей 00 копеек</strong>, в том числе:
              </p>
              <ul style={{ margin: '0 0 8px 25px', padding: 0 }}>
                <li>Стоимость силового оборудования, КТП, ячеек и кабельной продукции: {Number(calcData.materialsCost).toLocaleString('ru-RU')} руб.</li>
                <li>Стоимость СМР, эксплуатации строительной техники, СУ и благоустройства трассы: {Number(calcData.installationCost).toLocaleString('ru-RU')} руб.</li>
              </ul>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                3.2. Базовая стоимость без налогов: {pureCost.toLocaleString('ru-RU')} руб. Сумма начисленного НДС по ставке 20%: {vatCost.toLocaleString('ru-RU')} руб. Расчеты производятся поэтапно в соответствии с графиком финансирования.
              </p>

              {/* Блок подписей */}
              <div style={{ marginTop: 35, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, fontSize: 11, borderTop: '1px solid #000', paddingTop: 15 }}>
                <div>
                  <h6 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: 11 }}>ПОДРЯДЧИК:</h6>
                  <p style={{ margin: '2px 0' }}><strong>Филиал ПАО «Россети Волга» — «Оренбургэнерго»</strong></p>
                  <p style={{ margin: '2px 0' }}>460024, г. Оренбург, ул. Маршала Жукова, д. 44</p>
                  <p style={{ marginTop: 20 }}>Директор филиала: ___________ / Кажаев В.Ф. /</p>
                </div>
                <div>
                  <h6 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: 11 }}>ЗАКАЗЧИК:</h6>
                  <p style={{ margin: '2px 0' }}><strong>{calcData.clientName}</strong></p>
                  <p style={{ margin: '2px 0' }}>Юридический адрес: {calcData.address}</p>
                  <p style={{ marginTop: 35 }}>Генеральный директор: _______________________</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* ОКНО ПЕЧАТИ ДОКУМЕНТА 2: АКТ СТРОИТЕЛЬНОГО КОНТРОЛЯ И ТЕХНАДЗОРА         */}
        {/* ====================================================================== */}
        {activeDoc === 'act' && (
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
                  🖨️ Напечатать Акт Строительного Контроля
                </button>
                <button onClick={() => setActiveDoc(null)} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Закрыть бланк
                </button>
              </div>

              {/* Тело производственного наряда */}
              <div style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 'bold', color: '#444' }}>
                ПАО «РОССЕТИ ВОЛГА» · УПРАВЛЕНИЕ ТЕХНИЧЕСКОГО НАДЗОРА И СТРОИТЕЛЬНОГО КОНТРОЛЯ
              </div>

              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: 14 }}>АКТ СТРОИТЕЛЬНОЙ ГОТОВНОСТИ № СМР-АКТ-{calcData.contractNumber.split('-')[3]}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 11, fontWeight: 'bold' }}>освидетельствования строительной готовности энергообъекта к передаче под пусконаладочные работы</p>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', border: '1px solid #CBD5E1', marginBottom: 15, fontSize: 11 }}>
                <strong>Объект контроля:</strong> Энергопринимающие устройства класса {calcData.voltageLevel}<br />
                <strong>Адрес застройки:</strong> {calcData.address}<br />
                <strong>Генеральный подрядчик:</strong> УКС Филиала ПАО «Россети Волга» — «Оренбургэнерго»
              </div>

              <h4 style={{ fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8 }}>
                I. ОЦЕНКА ВЫПОЛНЕННЫХ ОБЪЕМОВ СТРОИТЕЛЬСТВА В НАТУРЕ
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15, fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#F1F5F9' }}>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Конструктивный элемент / Трасса</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Фактическое состояние и результаты измерений технадзора</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Линейная часть (КЛ/ВЛ):</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Кабель уложен в траншею на глубину 0.7м на песчаную подушку, защищен кирпичом/плитами ПЗК. Протяженность трассы: {calcData.cableLength} км. Механические повреждения оболочки отсутствуют.</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Конструктив подстанции (КТП):</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Корпус КТП установленной мощностью {calcData.powerRequested} кВА смонтирован на монолитном блоке. Двери оснащены внутренними замками, нанесены знаки безопасности. Материалы освоены на сумму: {calcData.materialsCost} руб.</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Заземляющее устройство:</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Выполнен контур заземления из полосовой стали 40х4. Сопротивление растеканию контура по результатам инструментального замера лаборатории составило 3.8 Ом (норма по ПУЭ &le; 4 Ом).</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Исполнительные схемы:</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Чертежи трассы с геодезическими привязками к реперам согласованы Департаментом градостроительства. Сметно-монтажные работы закрыты на сумму {calcData.installationCost} руб.</td>
                  </tr>
                </tbody>
              </table>

              <h4 style={{ fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8 }}>
                II. ЗАКЛЮЧЕНИЕ СТРОИТЕЛЬНОЙ ИНСПЕКЦИИ ПОДРАЗДЕЛЕНИЯ
              </h4>
              <ul style={{ paddingLeft: '20px', margin: '0 0 15px 0', fontSize: 11, lineHeight: '1.5' }}>
                <li>Строительно-монтажные работы по объекту {calcData.contractNumber} выполнены в полном объеме согласно проекту и действующим СНиП.</li>
                <li>Строительные конструкции подстанции и линейные сооружения КЛ считаются **готовыми для передачи Службе наладки** (ПНР) и проведения высоковольтных испытаний.</li>
                <li>Замечания инспектора строительного контроля: **Не выявлены**. Основные геометрические параметры трассы соблюдены.</li>
              </ul>

              <div style={{ marginTop: 35, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <div>
                  <p><strong>Инспектор строительного контроля ПТО:</strong><br />Главный специалист отдела капстроительства ПО</p>
                  <p style={{ marginTop: 15 }}>Подпись: _________________ / {user?.name || 'Системный программист'} /</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button className="d-print-none" onClick={() => handleApproveAndSend('Акт')} style={{ background: '#E67E22', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                    ✓ Утвердить Акт строительного контроля
                  </button>
                  <p style={{ margin: '4px 0 0 0', fontSize: 10, color: '#6B7A8D' }}>Системный штамп времени ПТО: {new Date().toLocaleDateString('ru-RU')}</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default ConstructionServicePage