import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const ConnectServicePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Управление открытием конкретного документа: 'contract' | 'order' | null
  const [activeDoc, setActiveDoc] = useState<'contract' | 'order' | null>(null)

  // Данные для калькуляции стандартного технологического присоединения
  const [calcData, setCalcData] = useState({
    clientName: 'ООО "Оренбургский Текстиль"',
    innData: '5610204456 / КПП 561001001',
    address: 'г. Оренбург, ул. Инструментальная, д. 12/2',
    powerRequested: '65', // Запрашиваемая мощность в кВт
    voltageLevel: '0.4 кВ (НН)', // Уровень напряжения
    reliabilityClass: 'III (Третья категория)', // Категория надежности
    contractNumber: 'РОССЕТИ-ТП-2026-304',
    sourceSubstation: 'ПС 110/10 кВ "Южная" (Фидер 10 кВ №7, ТП-412)',
    meterCost: '32000', // Стоимость шкафа учета с прибором РиМ/Миртек и модемом
    workCost: '43500'   // Монтаж ответвления, проверка контура заземления и допуск
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
      await api.post('/service-requests/connect/approve', { ...calcData, docType })
      alert(`${docType} по технологическому присоединению успешно зарегистрирован в АСУ "Сетевой инжиниринг"!`)
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
            <span style={{ fontSize: 32 }}>⚡</span>
            <div>
              <h4 style={{ margin: 0, fontWeight: 600 }}>Технологическая карта: Технологическое присоединение (Стандарт)</h4>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: 13 }}>
                Стандартизированный регламент подключения энергопринимающих устройств потребителей (до 150 кВт) · «Оренбургэнерго»
              </p>
            </div>
          </div>
        </div>

        {/* ОСНОВНОЙ КОНТЕНТ: ТЕХНИЧЕСКИЙ РЕГЛАМЕНТ ДЛЯ СОТРУДНИКА */}
        <div className="d-print-none" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 20, marginBottom: 24 }}>

          {/* Левая колонка: Производственные требования */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', padding: 20 }}>
            <h5 style={{ fontWeight: 600, color: '#1A2B3C', borderBottom: '2px solid #F0F4F8', paddingBottom: 8, marginBottom: 15 }}>
              📋 Инженерные правила реализации ТУ
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, lineHeight: '1.5' }}>
              <div>
                <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>1. Точка присоединения и распределение нагрузок</strong>
                <span style={{ color: '#445566' }}>
                  Точку присоединения мощности <strong>{calcData.powerRequested} кВт</strong> организовать на ближайшей концевой или проходной опоре ВЛ-0.4 кВ от <strong>{calcData.sourceSubstation.split('(')[1].replace(')', '')}</strong>. При подключении проверить симметрию токов по фазам А, В, С для исключения перекоса фаз и смещения нейтрали на головном трансформаторе ТМГ.
                </span>
              </div>

              <div>
                <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>2. Организация учета и выносной пункт (ВПУ)</strong>
                <span style={{ color: '#445566' }}>
                  Монтаж шкафа ВПУ осуществлять на теле опоры на доступной высоте (1.7 м от уровня земли) вне границ участка заявителя. Прибор учета должен поддерживать многотарифный учет, иметь класс точности не ниже 1.0 и укомплектован встроенными расцепителями для дистанционного ограничения мощности при превышении лимита по договору.
                </span>
              </div>

              <div>
                <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>3. Измерения и электробезопасность при допуске</strong>
                <span style={{ color: '#445566' }}>
                  Перед фактическим пуском энергопринимающих устройств произвести: замер сопротивления изоляции кабельных вводов, проверку целостности заземляющего спуска опоры (сопротивление не более <strong>10 Ом</strong>) и измерение полного сопротивления петли «фаза-ноль» для подтверждения надежности срабатывания автоматического выключателя при КЗ.
                </span>
              </div>
            </div>
          </div>

          {/* Правая колонка: Калькулятор параметров ТУ */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h5 style={{ fontWeight: 600, color: '#1A2B3C', borderBottom: '2px solid #F0F4F8', paddingBottom: 8, marginBottom: 15 }}>
                📊 Параметры ТУ и Сметы
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>НАИМЕНОВАНИЕ ЗАЯВИТЕЛЯ</label>
                  <input type="text" value={calcData.clientName} onChange={e => setCalcData({...calcData, clientName: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ИНН / КПП ОРГАНИЗАЦИИ</label>
                  <input type="text" value={calcData.innData} onChange={e => setCalcData({...calcData, innData: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 8 }}>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ЦЕНТР ПИТАНИЯ (ИСТОЧНИК)</label>
                    <input type="text" value={calcData.sourceSubstation} onChange={e => setCalcData({...calcData, sourceSubstation: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>МОЩНОСТЬ (КВТ)</label>
                    <input type="number" value={calcData.powerRequested} onChange={e => setCalcData({...calcData, powerRequested: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>ШКАФ УЧЕТА (РУБ)</label>
                    <input type="number" value={calcData.meterCost} onChange={e => setCalcData({...calcData, meterCost: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: 4 }}>МЕРОПРИЯТИЯ СМР (РУБ)</label>
                    <input type="number" value={calcData.workCost} onChange={e => setCalcData({...calcData, workCost: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14, marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1A2B3C' }}>Итого нормативная плата:</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0057A8' }}>{totalCost.toLocaleString('ru-RU')} руб.</span>
              </div>

              {/* Кнопки генерации документов */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => setActiveDoc('contract')}
                  style={{ width: '100%', background: '#0057A8', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  📜 Создать официальный Договор ТП (Стандарт)
                </button>
                <button
                  onClick={() => setActiveDoc('order')}
                  style={{ width: '100%', background: '#E67E22', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  ⚙️ Создать Наряд-Допуск на подключение к ЛЭП
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
        {/* ОКНО ПЕЧАТИ ДОКУМЕНТА 1: ОФИЦИАЛЬНЫЙ ДОГОВОР ТЕХПРИСОЕДИНЕНИЯ           */}
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
                  🖨️ Напечатать Договор техприсоединения
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
                <h3 style={{ fontWeight: 'bold', marginTop: 15, fontSize: 15 }}>
                  ДОГОВОР № {calcData.contractNumber}
                </h3>
                <h4 style={{ fontWeight: 'bold', margin: '4px 0 0 0', fontSize: 12 }}>
                  об осуществлении технологического присоединения к электрическим сетям
                </h4>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontWeight: 'bold' }}>
                <span>г. Оренбург</span>
                <span>«{new Date().toLocaleDateString('ru-RU')}» г.</span>
              </div>

              <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                Публичное акционерное общество <strong>«Россети Волга»</strong>, в лице директора филиала «Оренбургэнерго» <strong>Кажаева Виктора Федоровича</strong>, действующего на основании Доверенности № 56-АА/2025-11 от 12.12.2025 г., именуемое в дальнейшем <strong>«Сетевая организация»</strong>, с одной стороны, и юридическое лицо <strong>{calcData.clientName}</strong>, ИНН/КПП: {calcData.innData}, именуемое в дальнейшем <strong>«Заявитель»</strong>, с другой стороны, заключили настоящий Договор в соответствии с Правилами технологического присоединения, утвержденными Постановлением Правительства РФ № 861:
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>1. ПРЕДМЕТ ДОГОВОРА</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                1.1. Сетевая организация принимает на себя обязательства по осуществлению технологического присоединения энергопринимающих устройств Заявителя (производственно-административного объекта) с запрашиваемой максимальной мощностью <strong>{calcData.powerRequested} кВт</strong> по {calcData.reliabilityClass} надежности на уровне напряжения {calcData.voltageLevel}.
              </p>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                1.2. Объект расположен по адресу: {calcData.address}. Мероприятия со стороны Сетевой организации выполняются до границы земельного участка Заявителя.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>2. РАСПРЕДЕЛЕНИЕ ОБЯЗАТЕЛЬСТВ И ГРАНИЦЫ</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                2.1. Сетевая организация выполняет: подготовку схемы распределительной сети от исходного источника питания — <u>{calcData.sourceSubstation}</u>, проверку пропускной способности ЛЭП, монтаж шкафа учета РиМ/Миртек с интеграцией в систему верхнего уровня.
              </p>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                2.2. Заявитель выполняет мероприятия в пределах границ своего земельного участка, включая монтаж внутреннего распределительного щита (ВРУ-0.4 кВ) и прокладку соединительного силового кабеля до точки присоединения на опоре Подрядчика.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>3. ПЛАТА ПО ДОГОВОРУ И ПОРЯДОК РАСЧЕТОВ</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                3.1. Плата за технологическое присоединение установлена Департаментом Оренбургской области по ценам и регулированию тарифов и составляет: <strong>{totalCost.toLocaleString('ru-RU')} рублей 00 копеек</strong>, в том числе:
              </p>
              <ul style={{ margin: '0 0 8px 25px', padding: 0 }}>
                <li>Оборудование измерительного шкафа автоматизированного сбора: {Number(calcData.meterCost).toLocaleString('ru-RU')} руб.</li>
                <li>Строительно-монтажные и пусконаладочные работы на КТП/ЛЭП: {Number(calcData.workCost).toLocaleString('ru-RU')} руб.</li>
              </ul>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                3.2. Сумма чистой стоимости без налога: {pureCost.toLocaleString('ru-RU')} руб. Налог НДС (20%): {vatCost.toLocaleString('ru-RU')} руб. Внесение платы осуществляется этапами (предоплата, выполнение, финальный платеж).
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 'bold', margin: '14px 0 6px 0' }}>4. ПРОЧИЕ УСЛОВИЯ И ОТВЕТСТВЕННОСТЬ</h4>
              <p style={{ textIndent: '25px', margin: '0 0 8px 0' }}>
                4.1. Срок выполнения мероприятий по технологическому присоединению составляет 6 месяцев со дня заключения Договора. Споры и разногласия Сторон подлежат урегулированию в досудебном (претензионном) порядке, а при недостижении согласия — в судебном порядке.
              </p>

              {/* Блок подписей и реквизитов */}
              <div style={{ marginTop: 35, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, fontSize: 11, borderTop: '1px solid #000', paddingTop: 15 }}>
                <div>
                  <h6 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: 11 }}>СЕТЕВАЯ ОРГАНИЗАЦИЯ:</h6>
                  <p style={{ margin: '2px 0' }}><strong>Филиал ПАО «Россети Волга» — «Оренбургэнерго»</strong></p>
                  <p style={{ margin: '2px 0' }}>460024, г. Оренбург, ул. Маршала Жукова, д. 44</p>
                  <p style={{ margin: '2px 0' }}>ИНН 6450014147 / КПП 561202001</p>
                  <p style={{ marginTop: 25 }}>Директор филиала: ___________ / Кажаев В.Ф. /</p>
                </div>
                <div>
                  <h6 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: 11 }}>ЗАЯВИТЕЛЬ:</h6>
                  <p style={{ margin: '2px 0' }}><strong>{calcData.clientName}</strong></p>
                  <p style={{ margin: '2px 0' }}>Адрес: {calcData.address}</p>
                  <p style={{ margin: '2px 0' }}>ИНН/КПП: {calcData.innData}</p>
                  <p style={{ marginTop: 40 }}>Представитель (по Уставу): _______________________</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* ОКНО ПЕЧАТИ ДОКУМЕНТА 2: ПРОИЗВОДСТВЕННЫЙ НАРЯД-ДОПУСК ДЛЯ СЕТЕВЫХ БРИГАД */}
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
                  🖨️ Напечатать Наряд-Допуск Оренбургского РЭС
                </button>
                <button onClick={() => setActiveDoc(null)} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Закрыть бланк
                </button>
              </div>

              {/* Производственный бланк наряда */}
              <div style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 'bold', color: '#444' }}>
                ПАО «РОССЕТИ ВОЛГА» · ОРЕНБУРГСКИЕ ЭЛЕКТРИЧЕСКИЕ СЕТИ · СЛУЖБА ПОДКЛЮЧЕНИЙ БАЗОВЫХ ПОТРЕБИТЕЛЕЙ
              </div>

              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: 14 }}>ПРОИЗВОДСТВЕННЫЙ НАРЯД-ДОПУСК № ТП-{calcData.contractNumber.split('-')[3]}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 11, fontWeight: 'bold' }}>на выполнение строительно-монтажных процедур допуска электроустановок потребителя</p>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', border: '1px solid #CBD5E1', marginBottom: 15, fontSize: 11 }}>
                <strong>Производитель работ:</strong> Старший мастер производственного участка службы учета и распределения РЭС<br />
                <strong>Адрес проведения технических мероприятий:</strong> {calcData.address}<br />
                <strong>Технические параметры ТУ:</strong> Максимальная нагрузка {calcData.powerRequested} кВт, Фидер: {calcData.sourceSubstation}
              </div>

              <h4 style={{ fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8 }}>
                I. СПЕЦИФИКАЦИЯ РЕАЛИЗУЕМЫХ МАТЕРИАЛОВ И СМЕТНАЯ ЧАСТЬ
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15, fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#F1F5F9' }}>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Элемент сетевой infrastructure</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Технические параметры установки по проекту</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Выносной измерительный пункт:</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Герметичный металлический шкаф ВПУ, класс пылезащиты IP54. Смета: {calcData.meterCost} руб.</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Расчетный прибор учета:</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Интеллектуальный трехфазный прибор учета РиМ / Миртек прямого включения со встроенным GSM-модемом.</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Кабельный ввод ответвления:</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Провод самонесущий изолированный марки СИП-4 4х25 (или 4х16 в зависимости от тока расцепителя).</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Затраты на пусконаладку СМР:</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Проверка фазировки, замер петли «фаза-ноль» и ошиновка автоматов защиты (Выделено: {calcData.workCost} руб.)</td>
                  </tr>
                </tbody>
              </table>

              <h4 style={{ fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8 }}>
                II. ТЕХНИЧЕСКИЙ РЕГЛАМЕНТ ДЛЯ МОНТАЖНОЙ БРИГАДЫ
              </h4>
              <ol style={{ paddingLeft: '20px', margin: '0 0 15px 0', fontSize: 11, lineHeight: '1.5' }}>
                <li><strong>Монтаж выносного пункта учета (ВПУ):</strong> Закрепить шкаф учета бандажной лентой на опоре ВЛ согласно проектной схеме. Произвести подключение к силовой магистрали ЛЭП с использованием прокалывающих герметичных зажимов.</li>
                <li><strong>Проверка цепей заземления:</strong> Измерить сопротивление повторного заземления нулевого провода на опоре. Убедиться, что значение соответствует ПУЭ (не более 10 Ом).</li>
                <li><strong>Допуск и пломбировка:</strong> Установить антимагнитные наклейки и пластиковые номерные роторные пломбы на клеммную крышку счетчика и вводной автоматический выключатель. Оформить Акт проверки узла учета и Акт разграничения балансовой принадлежности (АРБП).</li>
              </ol>

              <div style={{ marginTop: 35, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <div>
                  <p><strong>Выдачу задания санкционировал:</strong><br />Начальник производственно-технического отдела РЭС</p>
                  <p style={{ marginTop: 15 }}>Подпись: _________________ / {user?.name || 'Системный программист'} /</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button className="d-print-none" onClick={() => handleApproveAndSend('Наряд')} style={{ background: '#E67E22', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                    ✓ Выдать наряд бригаде РЭС
                  </button>
                  <p style={{ margin: '4px 0 0 0', fontSize: 10, color: '#6B7A8D' }}>Сгенерировано в системе: {new Date().toLocaleDateString('ru-RU')}</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default ConnectServicePage