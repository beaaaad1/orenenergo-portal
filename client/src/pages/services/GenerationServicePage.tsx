import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import Swal from 'sweetalert2'

const GenerationServicePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Активный документ в модальном окне: 'contract' | 'order' | null
  const [activeDoc, setActiveDoc] = useState<'contract' | 'order' | null>(null)

  // Переключатель типа контрагента (Юр. лицо / Физ. лицо)
  const [isOrganization, setIsOrganization] = useState<boolean>(true)

  // Все поля очищены по умолчанию для ручного ввода данных оператором
  const [calcData, setCalcData] = useState({
    // Физическое лицо
    individualName: '',
    passportData: '',

    // Юридическое лицо
    clientName: '',
    inn: '',
    kpp: '',
    ogrn: '',
    directorName: '',
    directorTitle: '',

    // Контакты и объект
    phone: '',
    email: '',
    address: '',
    contractNumber: '',
    warrantyMonths: '',

    // Технические условия распределенной генерации
    genType: '',           // Тип (Газопоршневая, СЭС, ВЭС)
    powerRequested: '',    // Мощность в кВт
    voltageLevel: '',      // Класс напряжения (10 кВ, 35 кВ, 110 кВ)
    connectionPoint: '',   // Точка подключения (Ячейка РУ, шины ПС)

    // Финансовые показатели
    equipmentCost: '',     // Смета на ячейки и СМР (руб)
    relayProtectionCost: '' // Смета на автоматику РЗА и телеметрию (руб)
  })

  // Динамический подсчет стоимости
  const eqPrice = Number(calcData.equipmentCost || 0)
  const rzaPrice = Number(calcData.relayProtectionCost || 0)
  const totalCost = eqPrice + rzaPrice
  const vatCost = Math.round(totalCost * 0.20)

  const handlePrint = () => {
    window.print()
  }

  // Функция сохранения с четким распределением по категориям (Договоры -> contract, Заявления -> order)
  const handleApproveAndSend = async (targetCategory: 'contract' | 'order') => {
    const label = targetCategory === 'contract' ? 'Договор' : 'Наряд-допуск (Заявление)'
    try {
      const payload = {
        title: `${targetCategory === 'contract' ? 'Договор ТП' : 'Наряд на РЗА'} № ${calcData.contractNumber || 'Б/Н'} (${calcData.powerRequested || 0} кВт)`,
        category: targetCategory, // Строгое распределение на бэкенде
        department: 'Служба высоковольтных сетей и генерации',
        metaData: {
          ...calcData,
          isOrganization,
          totalCost,
          vatCost,
          operatorName: user?.name || 'Системный диспетчер'
        }
      }

      Swal.fire({
        title: 'Регистрация документа в АСУ...',
        text: 'Сохранение данных и привязка к категории',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading() }
      })

      await api.post('/documents/generate-generation', payload)

      Swal.fire({
        icon: 'success',
        title: 'Успешно сохранено!',
        text: `${label} успешно зарегистрирован и отправлен в соответствующий раздел архива документов.`,
        confirmButtonColor: '#E67E22'
      })

      setActiveDoc(null)
    } catch (err: any) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Ошибка АСУ',
        text: err.response?.data?.message || 'Не удалось сохранить документ на сервере.'
      })
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ background: '#F4F7FA', minHeight: '100vh', padding: '20px 0' }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 20px' }}>

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

          {/* Информационная Шапка в фирменном стиле */}
          <div className="d-print-none shadow-sm" style={{ background: '#E67E22', color: '#fff', padding: '24px', borderRadius: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 36 }}>🏭</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700 }}>Технологическая карта: Распределенная крупная генерация</h4>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: 13 }}>
                  Управление процессами интеграции и проверки ТУ промышленных электростанций ПАО «Россети Волга»
                </p>
              </div>
            </div>
          </div>

          {/* Нормативно-справочный блок ПУЭ */}
          <div className="card shadow-sm d-print-none" style={{ borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, background: '#fff', marginBottom: 20 }}>
            <h5 style={{ fontWeight: 700, color: '#1E293B', borderBottom: '2px solid #F1F5F9', paddingBottom: 8, marginBottom: 12 }}>
              ⚡ Регламент организации систем РЗА и Диспетчеризации (ПУЭ-7)
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, fontSize: 13, color: '#475569', lineHeight: '1.5' }}>
              <div>
                <strong>• Автоматика РЗА:</strong> Все генерирующие объекты мощностью более 1 МВт подлежат интеграции с микропроцессорными шкафами защит и организацией каналов БДУ из ОДУ.
              </div>
              <div>
                <strong>• Телеметрия и учет:</strong> Организация выделенных оптических каналов связи (ВОЛС) для ежеминутной передачи параметров генерации и телеизмерений на пульт ЦУС.
              </div>
              <div>
                <strong>• Противоаварийная защита:</strong> Установка комплексов АОЧН и АОСН на стороне выдачи мощности для исключения несанкционированной работы станции на изолированный район.
              </div>
            </div>
          </div>

          {/* Интерактивная форма ввода параметров */}
          <div className="card shadow-sm d-print-none" style={{ borderRadius: 12, border: '1px solid #E2E8F0', padding: 25, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #F1F5F9', paddingBottom: 12, marginBottom: 20 }}>
              <h5 style={{ fontWeight: 700, color: '#1E293B', margin: 0 }}>
                ⚙️ Параметры технологического присоединения генерации
              </h5>

              <div className="btn-group" role="group" style={{ width: '320px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${isOrganization ? 'btn-warning text-white' : 'btn-outline-warning'}`}
                  onClick={() => setIsOrganization(true)}
                  style={{ fontWeight: 600 }}
                >
                  Юридическое лицо
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${!isOrganization ? 'btn-warning text-white' : 'btn-outline-warning'}`}
                  onClick={() => setIsOrganization(false)}
                  style={{ fontWeight: 600 }}
                >
                  Физическое лицо
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Реквизиты заявителя */}
              <div>
                <h6 style={{ fontWeight: 600, color: '#475569', marginBottom: 12, fontSize: 14 }}>1. Данные балансодержателя генерирующего объекта</h6>
                {isOrganization ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>НАИМЕНОВАНИЕ ПРЕДПРИЯТИЯ / СОБСТВЕННИКА</label>
                      <input type="text" className="form-control form-control-sm" placeholder="Напр. ООО Оренбургская ВЭС" value={calcData.clientName} onChange={e => setCalcData({...calcData, clientName: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ИНН</label>
                      <input type="text" className="form-control form-control-sm" placeholder="ИНН организации" value={calcData.inn} onChange={e => setCalcData({...calcData, inn: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>КПП</label>
                      <input type="text" className="form-control form-control-sm" placeholder="КПП организации" value={calcData.kpp} onChange={e => setCalcData({...calcData, kpp: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ОГРН ЮРИДИЧЕСКОГО ЛИЦА</label>
                      <input type="text" className="form-control form-control-sm" placeholder="Основной гос. регистрационный номер" value={calcData.ogrn} onChange={e => setCalcData({...calcData, ogrn: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ДОЛЖНОСТЬ РУКОВОДИТЕЛЯ</label>
                      <input type="text" className="form-control form-control-sm" placeholder="Генеральный директор / Директор" value={calcData.directorTitle} onChange={e => setCalcData({...calcData, directorTitle: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ФИО РУКОВОДИТЕЛЯ (РОД. ПАДЕЖ)</label>
                      <input type="text" className="form-control form-control-sm" placeholder="Напр. Иванова Петра Сергеевича" value={calcData.directorName} onChange={e => setCalcData({...calcData, directorName: e.target.value})} />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ФИО ИНДИВИДУАЛЬНОГО ИНВЕСТОРA</label>
                      <input type="text" className="form-control form-control-sm" placeholder="ФИО инвестора полностью" value={calcData.individualName} onChange={e => setCalcData({...calcData, individualName: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ПАСПОРТНЫЕ ДАННЫЕ</label>
                      <input type="text" className="form-control form-control-sm" placeholder="Серия, номер, кем и когда выдан" value={calcData.passportData} onChange={e => setCalcData({...calcData, passportData: e.target.value})} />
                    </div>
                  </div>
                )}
              </div>

              {/* Даты и контакты */}
              <div>
                <h6 style={{ fontWeight: 600, color: '#475569', marginBottom: 12, fontSize: 14 }}>2. Регистрационные параметры и сроки</h6>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1.5fr', gap: 12 }}>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>НОМЕР ДЕЛА / ДОГОВОРА ТП</label>
                    <input type="text" className="form-control form-control-sm" placeholder="РОССЕТИ-ГЕН-2026-XXXX" value={calcData.contractNumber} onChange={e => setCalcData({...calcData, contractNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>СРОК СМР (МЕСЯЦЕВ)</label>
                    <input type="number" className="form-control form-control-sm" placeholder="Напр. 12" value={calcData.warrantyMonths} onChange={e => setCalcData({...calcData, warrantyMonths: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ТЕЛЕФОН СВЯЗИ</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Номер телефона" value={calcData.phone} onChange={e => setCalcData({...calcData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>АДРЕС ЭЛЕКТРОННОЙ ПОЧТЫ</label>
                    <input type="email" className="form-control form-control-sm" placeholder="example@generation.ru" value={calcData.email} onChange={e => setCalcData({...calcData, email: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Техническая часть и калькулятор */}
              <div>
                <h6 style={{ fontWeight: 600, color: '#475569', marginBottom: 12, fontSize: 14 }}>3. Спецификация выдачи мощности и финансовая смета инжиниринга</h6>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1.5fr 1.5fr', gap: 12 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ГЕОГРАФИЧЕСКОЕ РАСПОЛОЖЕНИЕ ЭЛЕКТРОСТАНЦИИ</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Адрес или кадастровый номер площадки" value={calcData.address} onChange={e => setCalcData({...calcData, address: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ТИП ЭНЕРГОУСТАНОВОК</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Газопоршневая ТЭЦ / ВЭС / СЭС" value={calcData.genType} onChange={e => setCalcData({...calcData, genType: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ПРОЕКТНАЯ МОЩНОСТЬ (КВТ)</label>
                    <input type="number" className="form-control form-control-sm" placeholder="Суммарная мощность установки" value={calcData.powerRequested} onChange={e => setCalcData({...calcData, powerRequested: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>КЛАСС НАПРЯЖ.</label>
                    <input type="text" className="form-control form-control-sm" placeholder="10 кВ / 35 кВ / 110 кВ" value={calcData.voltageLevel} onChange={e => setCalcData({...calcData, voltageLevel: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>ФИДЕР ПОДКЛЮЧЕНИЯ</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Ячейка №, наименование шин ПС" value={calcData.connectionPoint} onChange={e => setCalcData({...calcData, connectionPoint: e.target.value})} />
                  </div>

                  <div style={{ gridColumn: 'span 3' }}>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>СТОИМОСТЬ СТРОИТЕЛЬСТВА ВЫСОКОВОЛЬТНЫХ ЯЧЕЕК И ЛИНИЙ (РУБ)</label>
                    <input type="number" className="form-control form-control-sm" placeholder="Линейные и распределительные устройства" value={calcData.equipmentCost} onChange={e => setCalcData({...calcData, equipmentCost: e.target.value})} />
                  </div>
                  <div style={{ gridColumn: 'span 3' }}>
                    <label className="form-label text-muted mb-1" style={{ fontSize: 11, fontWeight: 600 }}>СМЕТА НА МОНТАЖ И НАЛАДКУ АВТОМАТИКИ РЗА И ТЕЛЕМЕТРИИ (РУБ)</label>
                    <input type="number" className="form-control form-control-sm" placeholder="Микропроцессорные шкафы защит" value={calcData.relayProtectionCost} onChange={e => setCalcData({...calcData, relayProtectionCost: e.target.value})} />
                  </div>
                </div>
              </div>

            </div>

            {/* Расчет стоимости и управляющие действия */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 20, marginTop: 25, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginRight: 10 }}>Стоимость инжиниринга крупной генерации:</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#E67E22' }}>{totalCost.toLocaleString('ru-RU')} руб.</span>
                <span style={{ fontSize: 12, color: '#64748B', marginLeft: 15 }}>(в т.ч. НДС 20%: {vatCost.toLocaleString('ru-RU')} руб.)</span>
              </div>

              <div style={{ display: 'flex', gap: 12, width: '460px' }}>
                <button onClick={() => setActiveDoc('contract')} className="btn btn-warning text-white btn-sm w-100" style={{ fontWeight: 600, height: '38px' }}>
                  📜 Сформировать Договор ТП
                </button>
                <button onClick={() => setActiveDoc('order')} className="btn btn-dark btn-sm w-100" style={{ fontWeight: 600, height: '38px' }}>
                  ⚡ Наряд-допуск на РЗА
                </button>
              </div>
            </div>
          </div>

          {/* Изолированные печатные стили медиа-запросов */}
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-modal-overlay { background: transparent !important; position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
              .print-document, .print-document * { visibility: visible; }
              .print-document { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; padding: 0mm !important; }
              .d-print-none { display: none !important; }
            }
          `}</style>

          {/* МОДАЛЬНЫЙ ПРОСМОТР БЛАНКА 1: ДОГОВОР (Сохраняется в Договоры) */}
          {activeDoc === 'contract' && (
            <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center', overflowY: 'auto', padding: '20px 0' }}>
              <div className="print-document" style={{ background: '#fff', width: '100%', maxWidth: '800px', height: 'fit-content', padding: '45px 55px', color: '#000', borderRadius: 4, fontFamily: 'Times New Roman, serif', fontSize: '14px', textAlign: 'justify', lineHeight: '1.4' }}>

                <div className="d-print-none" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25, borderBottom: '1px solid #E2E8F0', paddingBottom: 15, fontFamily: 'sans-serif' }}>
                  <button onClick={handlePrint} className="btn btn-primary btn-sm">🖨️ Запустить печать</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleApproveAndSend('contract')} className="btn btn-success btn-sm" style={{ background: '#10B981', border: 'none' }}>
                      ✓ Утвердить и отправить в Договоры
                    </button>
                    <button onClick={() => setActiveDoc(null)} className="btn btn-danger btn-sm">Закрыть</button>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <strong style={{ fontSize: '14px' }}>ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО «РОССЕТИ ВОЛГА»</strong><br />
                  <span style={{ fontSize: '12px' }}>ФИЛИАЛ «ОРЕНБУРГЭНЕРГО»</span>
                  <h4 style={{ fontWeight: 'bold', marginTop: 15, fontSize: '15px' }}>ДОГОВОР НА ТЕХНОЛОГИЧЕСКОЕ ПРИСОЕДИНЕНИЕ ОБЪЕКТОВ КРУПНОЙ ГЕНЕРАЦИИ № {calcData.contractNumber || '___________'}</h4>
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

                <h5 style={{ fontWeight: 'bold', fontSize: '14px', margin: '15px 0 5px 0' }}>1. ПРЕДМЕТ ДОГОВОРА</h5>
                <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                  1.1. Сетевая организация берет на себя обязательства по реализации технических условий для подключения генерирующего комплекса типа: <strong>{calcData.genType || '________________'}</strong>, проектной мощностью <strong>{calcData.powerRequested || '___'} кВт</strong> на уровне напряжения <strong>{calcData.voltageLevel || '___'}</strong> по адресу: <strong>{calcData.address || '________________'}</strong>.
                </p>

                <h5 style={{ fontWeight: 'bold', fontSize: '14px', margin: '15px 0 5px 0' }}>2. ФИНАНСОВЫЕ УСЛОВИЯ</h5>
                <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                  2.1. Итоговая стоимость комплексных работ по интеграции высоковольтных ячеек составляет <strong>{totalCost.toLocaleString('ru-RU')} руб.</strong> (включая НДС 20% — {vatCost.toLocaleString('ru-RU')} руб.).
                </p>

                <div style={{ marginTop: 45, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, fontSize: '13px', borderTop: '1px solid #000', paddingTop: 15 }}>
                  <div>
                    <strong>ОТ СЕТЕВОЙ ОРГАНИЗАЦИИ:</strong>
                    <p style={{ marginTop: 35 }}>__________________ / Кажаева В.Ф. /</p>
                  </div>
                  <div>
                    <strong>ОТ ЗАЯВИТЕЛЯ:</strong>
                    <p style={{ marginTop: 35 }}>__________________ / __________________ /</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* МОДАЛЬНЫЙ ПРОСМОТР БЛАНКА 2: НАРЯД-ДОПУСК (Сохраняется в Заявления) */}
          {activeDoc === 'order' && (
            <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center', overflowY: 'auto', padding: '20px 0' }}>
              <div className="print-document" style={{ background: '#fff', width: '100%', maxWidth: '800px', height: 'fit-content', padding: '45px 55px', color: '#000', borderRadius: 4, fontFamily: 'Arial, sans-serif', fontSize: '13px' }}>

                <div className="d-print-none" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25, borderBottom: '1px solid #E2E8F0', paddingBottom: 15 }}>
                  <button onClick={handlePrint} className="btn btn-primary btn-sm">🖨️ Запустить печать</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleApproveAndSend('order')} className="btn btn-success btn-sm" style={{ background: '#10B981', border: 'none' }}>
                      ✓ Утвердить и отправить в Заявления
                    </button>
                    <button onClick={() => setActiveDoc(null)} className="btn btn-danger btn-sm">Закрыть</button>
                  </div>
                </div>

                <div style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold', color: '#E67E22', letterSpacing: '0.5px' }}>
                  ПАО «РОССЕТИ ВОЛГА» · ЦЕНТРАЛЬНАЯ СЛУЖБА РЗА И МЕТРОЛОГИИ
                </div>

                <h4 style={{ marginTop: 15, fontWeight: 'bold', textAlign: 'center' }}>НАРЯД-ДОПУСК НА НАЛАДКУ ЗАЩИТНОЙ АВТОМАТИКИ СТАНЦИИ</h4>

                <table className="table table-bordered mt-3" style={{ fontSize: '13px' }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 'bold', width: '35%', backgroundColor: '#F8FAFC' }}>Наименование объекта</td>
                      <td>{isOrganization ? calcData.clientName : calcData.individualName} ({calcData.genType || 'Не указан'})</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', backgroundColor: '#F8FAFC' }}>Узел интеграции / Фидер</td>
                      <td>{calcData.connectionPoint || '___________'} на стороне {calcData.voltageLevel || '_______'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', backgroundColor: '#F8FAFC' }}>Параметры мощности</td>
                      <td>Выделенный предел: {calcData.powerRequested || '0'} кВт</td>
                    </tr>
                  </tbody>
                </table>

                <h5 style={{ fontWeight: 'bold', marginTop: 20 }}>РЕГЛАМЕНТ ПУСКОНАЛАДОЧНЫХ РАБОТ ДЛЯ БРИГАДЫ ИНЖЕНЕРОВ РЗА:</h5>
                <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                  <li>Проверить временные уставки микропроцессорных терминалов основной дистанционной и направленной защиты от замыканий на землю.</li>
                  <li>Провести физическое опробование высоковольтного выключателя в ячейке на включение и отключение от цепей противоаварийной автоматики.</li>
                  <li>Снять векторные диаграммы токов и напряжений под нагрузкой, передать отчет телеметрии на пульт диспетчера. Сметный лимит РЗА: {rzaPrice.toLocaleString('ru-RU')} руб.</li>
                </ol>

                <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div>
                    <p><strong>Задание согласовал:</strong><br />Старший диспетчер ОДС</p>
                    <p style={{ marginTop: 15 }}>Подпись: _________________ / {user?.name || 'Оператор системы'} /</p>
                  </div>
                  <div style={{ textAlign: 'right', color: '#64748B', fontSize: '11px' }}>
                    <p style={{ margin: 0 }}>АСУ «Энергосервис-Крупная Генерация»</p>
                    <p style={{ margin: '2px 0 0 0' }}>Сформировано: {new Date().toLocaleDateString('ru-RU')}</p>
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

export default GenerationServicePage