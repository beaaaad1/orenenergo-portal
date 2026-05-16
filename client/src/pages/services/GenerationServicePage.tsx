import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const GenerationServicePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Управление открытием конкретного документа: 'contract' | 'order' | null
  const [activeDoc, setActiveDoc] = useState<'contract' | 'order' | null>(null)

  // Данные для калькуляции ТП объектов генерации
  const [calcData, setCalcData] = useState({
    clientName: 'ООО "Солнечная Энергия Оренбуржья"',
    innData: '5612099431 / КПП 561201001',
    address: 'Оренбургская обл., Переволоцкий р-н, с. Переволоцкий, участок №4',
    genType: 'Солнечная электростанция (СЕС) с инверторными установками',
    powerRequested: '4500', // Запрашиваемая выдаваемая мощность в кВт
    voltageLevel: '10 кВ (СН-2)', // Уровень напряжения в точке выдачи
    contractNumber: 'РОССЕТИ-ГЕН-2026-009',
    connectionPoint: 'Ячейка №14 на РУ-10 кВ ПС 110/10 кВ "Степная"',
    equipmentCost: '890000', // Стоимость комплекта РЗА, АИИС КУЭ и систем телемеханики
    workCost: '450000'   // Строительство КЛ-10 кВ, пусконаладка ячейки и интеграция в ОИК СДУ
  })

  const totalCost = Number(calcData.equipmentCost) + Number(calcData.workCost)
  const vatCost = Math.round(totalCost * 0.20) // НДС 20%
  const pureCost = totalCost - vatCost

  const handlePrint = () => {
    window.print()
  }

  const handleApproveAndSend = async (docType: 'Договор' | 'Наряд') => {
    try {
      // ИСПОЛЬЗУЕМ КОРРЕТНЫЙ ЭНДПОИНТ ДЛЯ ВЗАИМОДЕЙСТВИЯ С BACKEND-РОУТЕРОМ
      await api.post('/service-requests/generation/approve', { ...calcData, docType })
      alert(`${docType} по объекту генерации успешно зарегистрирован в базе ОИК ДП и направлен Службе РЗА!`)
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

        {/* Хлебные крошки */}
        <div className="d-print-none" style={{ marginBottom: 15 }}>
          <button
            onClick={() => navigate('/contracts')}
            style={{ background: 'none', border: 'none', color: '#0057A8', cursor: 'pointer', fontWeight: 500, padding: 0 }}
          >
            ← Вернуться в панель договоров
          </button>
        </div>

        {/* Шапка регламента */}
        <div className="d-print-none" style={{ background: '#7C3AED', color: '#fff', padding: '24px', borderRadius: 10, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>🏭</span>
            <div>
              <h4 style={{ margin: 0, fontWeight: 600 }}>Технологическая карта: Объекты генерации</h4>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: 13 }}>
                Регламент выдачи мощности, диспетчеризации и интеграции распределенной генерации в ЕЭС · «Оренбургэнерго»
              </p>
            </div>
          </div>
        </div>

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <div className="d-print-none" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 20, marginBottom: 24 }}>

          {/* Левая колонка: Производственные требования */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', padding: 20 }}>
            <h5 style={{ fontWeight: 600, color: '#1A2B3C', borderBottom: '2px solid #F0F4F8', paddingBottom: 8, marginBottom: 15 }}>
              ⚙️ Особые technical условия для объектов генерации
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, lineHeight: '1.5' }}>
              <div>
                <strong style={{ color: '#7C3AED', display: 'block', marginBottom: 4 }}>1. Синхронизация, качество электроэнергии и РЗА</strong>
                <span style={{ color: '#445566' }}>
                  Генерирующие установки Заявителя мощностью <strong>{calcData.powerRequested} кВт</strong> должны быть оснащены автоматическими устройствами точной синхронизации с сетью «Оренбургэнерго». На границе балансовой принадлежности установить микропроцессорную защиту (минимального/максимального напряжения и частоты) для мгновенного отключения генератора при возникновении КЗ в сети общего пользования.
                </span>
              </div>

              <div>
                <strong style={{ color: '#7C3AED', display: 'block', marginBottom: 4 }}>2. Диспетчерское управление и телеметрия (ТМ)</strong>
                <span style={{ color: '#445566' }}>
                  Организовать прямой цифровой канал связи с Диспетчерским пунктом (ДП) РЭС/ПО. Обеспечить ежесекундную передачу телеизмерений текущей активной и реактивной мощности (P, Q), напряжения (U), токов (I) и телесигнализации положения вводного выключателя 10 кВ в протоколе <strong>МЭК 60870-5-104</strong>.
                </span>
              </div>

              <div>
                <strong style={{ color: '#7C3AED', display: 'block', marginBottom: 4 }}>3. Коммерческий учет высокой точности (АИИС КУЭ)</strong>
                <span style={{ color: '#445566' }}>
                  Для учета выданной и потребленной на собственные нужды электроэнергии применить двухнаправленные счетчики класса точности <strong>не ниже 0.2S/0.5</strong> с регистрацией профиля нагрузки каждые 30 минут. Измерительные трансформаторы тока (ТТ) и напряжения (ТН) должны пройти метрологическую поверку ЦСМ.
                </span>
              </div>
            </div>
          </div>

          {/* Правая колонка: Калькулятор сметы */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h5 style={{ fontWeight: 600, color: '#1A2B3C', borderBottom: '2px solid #F0F4F8', paddingBottom: 8, marginBottom: 15 }}>
                📊 Спецификация генерации
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ВЛАДЕЛЕЦ ГЕНЕРАЦИИ</label>
                  <input type="text" value={calcData.clientName} onChange={e => setCalcData({...calcData, clientName: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ТИП ЭЛЕКТРОСТАНЦИИ</label>
                  <input type="text" value={calcData.genType} onChange={e => setCalcData({...calcData, genType: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 8 }}>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ТОЧКА ПОДКЛЮЧЕНИЯ К СЕТИ</label>
                    <input type="text" value={calcData.connectionPoint} onChange={e => setCalcData({...calcData, connectionPoint: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ВЫДАЧА (КВТ)</label>
                    <input type="number" value={calcData.powerRequested} onChange={e => setCalcData({...calcData, powerRequested: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>АППАРАТУРА РЗА И ТМ (РУБ)</label>
                    <input type="number" value={calcData.equipmentCost} onChange={e => setCalcData({...calcData, equipmentCost: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>МОНТАЖ И СЕТЕВЫЕ СМР (РУБ)</label>
                    <input type="number" value={calcData.workCost} onChange={e => setCalcData({...calcData, workCost: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14, marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1A2B3C' }}>Стоимость инвестиционных ТУ:</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#7C3AED' }}>{totalCost.toLocaleString('ru-RU')} руб.</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => setActiveDoc('contract')}
                  style={{ width: '100%', background: '#7C3AED', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  📜 Создать Договор ТП объектов генерации
                </button>
                <button
                  onClick={() => setActiveDoc('order')}
                  style={{ width: '100%', background: '#E67E22', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  ⚙️ Наряд-Допуск на комплексную проверку РЗА
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
        {/* ОКНО ПЕЧАТИ ДОКУМЕНТА 1: ДОГОВОР НА ТП ОБЪЕКТОВ ГЕНЕРАЦИИ                */}
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
                <button onClick={handlePrint} style={{ background: '#7C3AED', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  🖨️ Напечатать Договор генерации
                </button>
                <button onClick={() => setActiveDoc(null)} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Закрыть бланк
                </button>
              </div>

              {/* Заголовок */}
              <div style={{ textTransform: 'uppercase', textAlign: 'center', marginBottom: 25 }}>
                <h4 style={{ fontWeight: 'bold', margin: 0, fontSize: 13 }}>
                  Публичное акционерное общество «Россети Волга»
                </h4>
                <h5 style={{ fontWeight: 'bold', margin: '4px 0 0 0', fontSize: 12 }}>
                  Филиал ПАО «Россети Волга» — «Оренбургэнерго»
                </h5>
                <div style={{ height: '1.5px', backgroundColor: '#000', width: '100%', marginTop: '8px', marginBottom: 15 }}></div>
                <h3 style={{ fontWeight: 'bold', marginTop: 15, fontSize: 14 }}>
                  ДОГОВОР № {calcData.contractNumber}
                </h3>
                <h4 style={{ fontWeight: 'bold', margin: '4px 0 0 0', fontSize: 11 }}>
                  об осуществлении технологического присоединения генерирующих объектов к электрическим сетям
                </h4>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontWeight: 'bold' }}>
                <span>г. Оренбург</span>
                <span>«{new Date().toLocaleDateString('ru-RU')}» г.</span>
              </div>

              <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                Филиал Публичного акционерного общества <strong>«Россети Волга» — «Оренбургэнерго»</strong>, именуемый в дальнейшем <strong>«Сетевая организация»</strong>, в лице директора филиала <strong>Кажаева Виктора Федоровича</strong>, действующего на основании Доверенности № 56-АА/2025-11 от 12.12.2025 г., с одной стороны, и собственник генерирующего объекта <strong>{calcData.clientName}</strong>, ИНН/КПП: {calcData.innData}, именуемый в дальнейшем <strong>«Заявитель»</strong>, с другой стороны, заключили настоящий Договор о нижеследующем:
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>1. ПРЕДМЕТ ДОГОВОРА</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                1.1. Сетевая организация принимает на себя обязательства по реализации технических мероприятий для обеспечения выдачи мощности от объекта генерации Заявителя типа: <u>{calcData.genType}</u> максимальной установленной мощностью <strong>{calcData.powerRequested} кВт</strong> в энергосистему Оренбургской области.
              </p>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                1.2. Точкой подключения и раздела балансовой принадлежности устанавливается: {calcData.connectionPoint}. Уровень напряжения в точке межсистемной связи составляет {calcData.voltageLevel}.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>2. ТЕХНИЧЕСКИЕ ОБЯЗАТЕЛЬСТВА СТОРОН</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                2.1. Сетевая организация обязуется подготовить сетевую инфраструктуру ячейки питающего центра, согласовать уставки микропроцессорных защит и обеспечить непрерывный прием телеметрических потоков информации в формате протокола МЭК-104 в оперативно-информационный комплекс ДП.
              </p>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                2.2. Заявитель обязуется за счет собственных средств укомплектовать распределительное устройство объекта генерации прецизионными шкафами АИИС КУЭ (класс точности 0.2S), быстродействующей релейной защитой от анормальных режимов работы сети ЕЭС и согласовать с Филиалом алгоритм работы противоаварийной автоматики деления.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>3. СМЕТНАЯ СТОИМОСТЬ И ПОРЯДОК РАСЧЕТОВ</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                3.1. Нормативная величина платы за присоединение генерирующего узла согласно инвестиционной смете ТУ составляет: <strong>{totalCost.toLocaleString('ru-RU')} рублей 00 копеек</strong>, в том числе:
              </p>
              <ul style={{ margin: '0 0 8px 25px', padding: 0 }}>
                <li>Спецоборудование связи, телемеханики и высокочастотной РЗА: {Number(calcData.equipmentCost).toLocaleString('ru-RU')} руб.</li>
                <li>Строительно-монтажные работы, наладка ячеек и КЛ: {Number(calcData.workCost).toLocaleString('ru-RU')} руб.</li>
              </ul>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                3.2. Базовая стоимость (чистая): {pureCost.toLocaleString('ru-RU')} руб. НДС (20%): {vatCost.toLocaleString('ru-RU')} руб. Оплата производится траншами согласно графику финансирования крупных ТП.
              </p>

              {/* Блок подписей */}
              <div style={{ marginTop: 35, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, fontSize: 11, borderTop: '1px solid #000', paddingTop: 15 }}>
                <div>
                  <h6 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: 11 }}>СЕТЕВАЯ ОРГАНИЗАЦИЯ:</h6>
                  <p style={{ margin: '2px 0' }}><strong>Филиал ПАО «Россети Волга» — «Оренбургэнерго»</strong></p>
                  <p style={{ margin: '2px 0' }}>460024, г. Оренбург, ул. Маршала Жукова, д. 44</p>
                  <p style={{ marginTop: 20 }}>Директор филиала: ___________ / Кажаев В.Ф. /</p>
                </div>
                <div>
                  <h6 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: 11 }}>ЗАЯВИТЕЛЬ:</h6>
                  <p style={{ margin: '2px 0' }}><strong>{calcData.clientName}</strong></p>
                  <p style={{ margin: '2px 0' }}>Адрес СЕС/ГЕН: {calcData.address}</p>
                  <p style={{ marginTop: 35 }}>Генеральный директор: _______________________</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* ОКНО ПЕЧАТИ ДОКУМЕНТА 2: НАРЯД-ДОПУСК НА НАЛАДКУ И ТЕСТИРОВАНИЕ РЗА    */}
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
                  🖨️ Напечатать Наряд-Допуск Службы РЗА/ТМ
                </button>
                <button onClick={() => setActiveDoc(null)} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Закрыть бланк
                </button>
              </div>

              {/* Тело производственного наряда */}
              <div style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 'bold', color: '#444' }}>
                ПАО «РОССЕТИ ВОЛГА» · СЛУЖБА РЕЛЕЙНОЙ ЗАЩИТЫ, АВТОМАТИКИ И ТЕЛЕМЕХАНИКИ ПОДСТАНЦИЙ
              </div>

              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: 14 }}>НАРЯД-ДОПУСК № РЗА-ГЕН-{calcData.contractNumber.split('-')[3]}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 11, fontWeight: 'bold' }}>на проведение индивидуальных испытаний и комплексного опробования систем защиты объектов генерации</p>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', border: '1px solid #CBD5E1', marginBottom: 15, fontSize: 11 }}>
                <strong>Производитель работ:</strong> Старший инженер Центральной службы РЗА филиала «Оренбургэнерго»<br />
                <strong>Место проведения испытаний:</strong> ПС 110 кВ, Точка интеграции: {calcData.connectionPoint}<br />
                <strong>Контрагент:</strong> {calcData.clientName} (Мощность ТП: {calcData.powerRequested} кВт)
              </div>

              <h4 style={{ fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8 }}>
                I. ПЕРЕЧЕНЬ ПРОВЕРЯЕМОГО ВЫСОКОТЕХНОЛОГИЧНОГО ОБОРУДОВАНИЯ
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15, fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#F1F5F9' }}>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Комплекс / Подсистема</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Состав технических мероприятий и проверок</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Микропроцессорные терминалы РЗА:</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Проверка логики защит от потери питания, направленной МТЗ и автоматики АЛАР (Выделено по смете: {calcData.equipmentCost} руб.)</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Каналы телемеханики (ТМ):</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Сквозная проверка прохождения сигналов ТС/ТИ от инверторов объекта до ОИК ДП филиала.</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Системы противоаварийной автоматики:</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Комплексное опробование цепей отключения вводного выключателя 10 кВ от сигналов деления частоты.</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Linear ячейки КРУ-10 кВ:</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Высоковольтные испытания изоляции кабельной разделки, замер переходных сопротивлений контактов (СМР: {calcData.workCost} руб.)</td>
                  </tr>
                </tbody>
              </table>

              <h4 style={{ fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8 }}>
                II. ОРГАНИЗАЦИОННЫЕ И ТЕХНИЧЕСКИЕ МЕРЫ БЕЗОПАСНОСТИ
              </h4>
              <ul style={{ paddingLeft: '20px', margin: '0 0 15px 0', fontSize: 11, lineHeight: '1.5' }}>
                <li><strong>Отключения:</strong> Выкатить тележку выключателя 10 кВ проверяемой ячейки в тестовое положение, вывесить плакаты «НЕ ВКЛЮЧАТЬ! РАБОТАЮТ ЛЮДИ». Вторичные цепи трансформаторов напряжения, идущие к защитам, надежно изолировать.</li>
                <li><strong>Проверка цепей:</strong> Подачу испытательного тока и напряжения от постороннего источника (установки типа Ретом) производить исключительно по команде производителя работ после удаления людей от токоведущих частей ячейки.</li>
                <li><strong>Диспетчерский контроль:</strong> Все операции по опробованию выключателя на включение/отключение производить с обязательным предварительным уведомлением дежурного диспетчера ПО.</li>
              </ul>

              <div style={{ marginTop: 35, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <div>
                  <p><strong>Допуск к работам разрешил:</strong><br />Начальник службы РЗА «Оренбургэнерго»</p>
                  <p style={{ marginTop: 15 }}>Подпись: _________________ / {user?.name || 'Системный программист'} /</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button className="d-print-none" onClick={() => handleApproveAndSend('Наряд')} style={{ background: '#E67E22', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                    ✓ Выдать наряд-допуск на опробование РЗА
                  </button>
                  <p style={{ margin: '4px 0 0 0', fontSize: 10, color: '#6B7A8D' }}>Системный штамп времени: {new Date().toLocaleDateString('ru-RU')}</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default GenerationServicePage