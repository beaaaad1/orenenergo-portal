import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import Swal from 'sweetalert2'

const ConstructionServicePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Управление открытием конкретного документа: 'contract' | 'act' | null
  const [activeDoc, setActiveDoc] = useState<'contract' | 'act' | null>(null)

  // Переключатель типа заявителя: true = Юр. лицо, false = Физ. лицо
  const [isOrganization, setIsOrganization] = useState<boolean>(true)

  // Все поля инициализированы пустыми строками без примеров для полностью ручного ввода
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
    directorTitle: 'Директора',

    // Общие параметры контракта и объекта СМР
    address: '',
    workScope: '', // Наименование/объем строительно-монтажных работ
    powerRequested: '', // Мощность объекта в кВт
    voltageLevel: '', // Уровень напряжения (например, 10 / 0.4 кВ)
    contractNumber: '', // Номер договора СМР
    cableLength: '', // Длина кабельной/воздушной линии в км

    // Экономика СМР
    materialsCost: '', // Стоимость материалов и оборудования (руб)
    constructionCost: '' // Стоимость строительно-монтажных работ (руб)
  })

  // Финансовые расчеты
  const totalCost = Number(calcData.materialsCost || 0) + Number(calcData.constructionCost || 0)
  const vatCost = Math.round(totalCost * 0.20) // НДС 20%


  const handlePrint = () => {
    window.print()
  }

  // Сборка HTML бланка и отправка файла + вызов бэкенд-эндпоинта логики
  const handleSaveAndApprove = async (docType: 'Договор СМР' | 'Акт контроля', category: 'contract' | 'application') => {
    try {
      const docElement = document.getElementById('printable-document-content')
      if (!docElement) return

      // Формируем чистый HTML документ со стилями Times New Roman для архива АСУ
      const fullHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${docType} № ${calcData.contractNumber || 'Б/Н'}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; color: #000; padding: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f8fafc; }
            .text-center { text-align: center; }
            .text-justify { text-align: justify; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          ${docElement.innerHTML}
        </body>
        </html>
      `

      const blob = new Blob([fullHtmlContent], { type: 'text/html' })
      const filename = `${category}_construction_${Date.now()}.html`
      const file = new File([blob], filename, { type: 'text/html' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', `${docType} СМР: ${calcData.contractNumber || 'Б/Н'} (${isOrganization ? calcData.clientName : calcData.individualName})`)
      formData.append('category', category)
      formData.append('department', 'Капитальное строительство и СМР')

      // 1. Сохраняем сгенерированный файл бланка в АСУ (Договоры или Заявления/Акты)
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // 2. Проводим операцию по бэкенд эндпоинту бизнес-логики заявки СМР
      await api.post('/service-requests/construction/approve', {
        ...calcData,
        docType,
        isOrganization,
        recipientFinalName: isOrganization ? calcData.clientName : calcData.individualName
      })

      Swal.fire({
        icon: 'success',
        title: 'Успешно проведено!',
        text: `Документ "${docType}" успешно сохранен в базу данных (раздел «${category === 'contract' ? 'Договоры' : 'Заявления'}») и направлен в архив Отдела капстроительства.`,
        confirmButtonColor: '#10B981'
      })

      setActiveDoc(null)
    } catch (err: any) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Ошибка проведения',
        text: err.response?.data?.message || 'Не удалось сохранить файл на сервере.'
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

          {/* Корпоративная плашка */}
          <div className="d-print-none shadow-sm" style={{ background: '#10B981', color: '#fff', padding: '24px', borderRadius: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 36 }}>🏗️</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700 }}>Строительно-монтажные работы (Капитальное строительство)</h4>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: 13 }}>
                  Интерфейс калькуляции смет, генерации договоров строительного подряда и актов строительного контроля · ПАО «Россети Волга»
                </p>
              </div>
            </div>
          </div>

          {/* Сетка модулей */}
          <div className="d-print-none" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr', gap: 20, marginBottom: 24 }}>

            {/* Левый блок: Нормативы и требования */}
            <div className="bg-white p-4 rounded-4 shadow-sm border-0">
              <h5 style={{ fontWeight: 700, color: '#1E293B', borderBottom: '2px solid #E2E8F0', paddingBottom: 10, marginBottom: 15 }}>
                📋 Регламент технического и строительного надзора
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14, lineHeight: '1.6' }}>
                <div>
                  <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>1. Земляные работы и трассировка КЛ/ВЛ</strong>
                  <span className="text-muted">
                    Прокладка кабельных линий в траншее должна выполняться в соответствии со СНиП. Обязательна подсыпка просеянного песка и укладка сигнальной ленты «Осторожно кабель» по всей длине трассы (<strong>{calcData.cableLength || '0'} км</strong>).
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>2. Входной контроль оборудования</strong>
                  <span className="text-muted">
                    Все монтируемые силовые трансформаторы КТП, ячейки КСО и кабельная продукция должны иметь сертификаты соответствия и протоколы заводских испытаний ПАО «Россети».
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>3. Сдача-приемка и ПНР</strong>
                  <span className="text-muted">
                    По окончании СМР проводятся пусконаладочные работы, замер сопротивления изоляции, испытание повышенным напряжением с оформлением технического отчета и передачей на баланс ПО.
                  </span>
                </div>
              </div>
            </div>

            {/* Правый блок: Двухвкладочная форма ввода */}
            <div className="bg-white p-4 rounded-4 shadow-sm border-0 d-flex flex-column justify-content-between">
              <div>
                {/* Переключатель типа контрагента */}
                <div className="d-flex bg-light p-1 rounded-3 mb-3">
                  <button
                    type="button"
                    className={`btn btn-sm w-50 py-2 rounded-2 border-0 ${isOrganization ? 'bg-white shadow-sm fw-bold text-dark' : 'text-secondary'}`}
                    onClick={() => setIsOrganization(true)}
                  >
                    🏢 Юридическое лицо
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm w-50 py-2 rounded-2 border-0 ${!isOrganization ? 'bg-white shadow-sm fw-bold text-dark' : 'text-secondary'}`}
                    onClick={() => setIsOrganization(false)}
                  >
                    👤 Физическое лицо / ИП
                  </button>
                </div>

                <h6 style={{ fontWeight: 700, color: '#334155', marginBottom: 12 }}>Данные Заказчика (Заявителя):</h6>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  {isOrganization ? (
                    <>
                      <div>
                        <label className="fw-semibold text-secondary mb-1">Наименование организации</label>
                        <input type="text" className="form-control form-control-sm rounded-2" value={calcData.clientName} onChange={e => setCalcData({...calcData, clientName: e.target.value})} />
                      </div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="fw-semibold text-secondary mb-1">ИНН</label>
                          <input type="text" className="form-control form-control-sm rounded-2" value={calcData.inn} onChange={e => setCalcData({...calcData, inn: e.target.value})} />
                        </div>
                        <div className="col-6">
                          <label className="fw-semibold text-secondary mb-1">КПП</label>
                          <input type="text" className="form-control form-control-sm rounded-2" value={calcData.kpp} onChange={e => setCalcData({...calcData, kpp: e.target.value})} />
                        </div>
                      </div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="fw-semibold text-secondary mb-1">ОГРН</label>
                          <input type="text" className="form-control form-control-sm rounded-2" value={calcData.ogrn} onChange={e => setCalcData({...calcData, ogrn: e.target.value})} />
                        </div>
                        <div className="col-6">
                          <label className="fw-semibold text-secondary mb-1">ФИО Руководителя</label>
                          <input type="text" className="form-control form-control-sm rounded-2" value={calcData.directorName} onChange={e => setCalcData({...calcData, directorName: e.target.value})} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="fw-semibold text-secondary mb-1">ФИО Физического лица / ИП</label>
                        <input type="text" className="form-control form-control-sm rounded-2" value={calcData.individualName} onChange={e => setCalcData({...calcData, individualName: e.target.value})} />
                      </div>
                      <div>
                        <label className="fw-semibold text-secondary mb-1">Паспортные данные</label>
                        <input type="text" className="form-control form-control-sm rounded-2" value={calcData.passportData} onChange={e => setCalcData({...calcData, passportData: e.target.value})} />
                      </div>
                    </>
                  )}

                  <hr className="my-1" />
                  <h6 style={{ fontWeight: 700, color: '#334155', margin: '4px 0' }}>Спецификация и Смета СМР:</h6>

                  <div>
                    <label className="fw-semibold text-secondary mb-1">Адрес объекта строительства</label>
                    <input type="text" className="form-control form-control-sm rounded-2" value={calcData.address} onChange={e => setCalcData({...calcData, address: e.target.value})} />
                  </div>

                  <div>
                    <label className="fw-semibold text-secondary mb-1">Содержание и объем работ (СМР)</label>
                    <textarea className="form-control form-control-sm rounded-2" rows={2} value={calcData.workScope} onChange={e => setCalcData({...calcData, workScope: e.target.value})} />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="fw-semibold text-secondary mb-1">№ Договора подряда</label>
                      <input type="text" className="form-control form-control-sm rounded-2" value={calcData.contractNumber} onChange={e => setCalcData({...calcData, contractNumber: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="fw-semibold text-secondary mb-1">Уровень напряжения (кВ)</label>
                      <input type="text" className="form-control form-control-sm rounded-2" value={calcData.voltageLevel} onChange={e => setCalcData({...calcData, voltageLevel: e.target.value})} />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="fw-semibold text-secondary mb-1">Протяженность линий (км)</label>
                      <input type="number" step="0.1" className="form-control form-control-sm rounded-2" value={calcData.cableLength} onChange={e => setCalcData({...calcData, cableLength: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="fw-semibold text-secondary mb-1">Мощность объекта (кВт)</label>
                      <input type="number" className="form-control form-control-sm rounded-2" value={calcData.powerRequested} onChange={e => setCalcData({...calcData, powerRequested: e.target.value})} />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="fw-semibold text-secondary mb-1">Стоимость материалов (руб)</label>
                      <input type="number" className="form-control form-control-sm rounded-2" value={calcData.materialsCost} onChange={e => setCalcData({...calcData, materialsCost: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="fw-semibold text-secondary mb-1">Стоимость работ СМР (руб)</label>
                      <input type="number" className="form-control form-control-sm rounded-2" value={calcData.constructionCost} onChange={e => setCalcData({...calcData, constructionCost: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Экономический блок и кнопки */}
              <div className="border-top pt-3 mt-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>Итого сметная стоимость:</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>{totalCost.toLocaleString('ru-RU')} руб.</span>
                </div>

                <div className="d-flex flex-column gap-2">
                  <button onClick={() => setActiveDoc('contract')} className="btn text-white w-100 py-2 rounded-3" style={{ backgroundColor: '#0057A8', fontWeight: 600, fontSize: '13px' }}>
                    📜 Создать Договор подряда СМР (Категория Договоры)
                  </button>
                  <button onClick={() => setActiveDoc('act')} className="btn text-white w-100 py-2 rounded-3" style={{ backgroundColor: '#E67E22', fontWeight: 600, fontSize: '13px' }}>
                    ✓ Создать Акт строительного контроля (Категория Заявления)
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* МОДАЛЬНОЕ ОКНО ПЕЧАТИ И АВТОМАТИЧЕСКОГО СОХРАНЕНИЯ В АСУ  */}
          {/* ========================================================= */}
          {activeDoc && (
            <div className="print-modal-overlay" style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center',
              overflowY: 'auto', padding: '40px 0'
            }}>
              <div className="print-document bg-white shadow-lg p-5 rounded-4" style={{ width: '100%', maxWidth: '850px', height: 'fit-content', color: '#000' }}>

                {/* Панель управления бланком */}
                <div className="d-print-none d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                  <div>
                    <button onClick={handlePrint} className="btn btn-sm btn-dark px-3 me-2 rounded-3">
                      🖨️ Печать бланка
                    </button>
                    <button
                      onClick={() => handleSaveAndApprove(activeDoc === 'contract' ? 'Договор СМР' : 'Акт контроля', activeDoc === 'contract' ? 'contract' : 'application')}
                      className="btn btn-sm text-white px-3 rounded-3"
                      style={{ backgroundColor: activeDoc === 'contract' ? '#0057A8' : '#E67E22', fontWeight: 600 }}
                    >
                      💾 Утвердить и Отправить в архив АСУ
                    </button>
                  </div>
                  <button onClick={() => setActiveDoc(null)} className="btn btn-sm btn-outline-danger px-3 rounded-3">
                    Закрыть бланк
                  </button>
                </div>

                {/* Печатное содержимое */}
                <div id="printable-document-content" style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '1.5', textAlign: 'justify' }}>

                  {activeDoc === 'contract' ? (
                    /* ДОКУМЕНТ: ДОГОВОР ПОДРЯДА НА СМР */
                    <div>
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <h5 style={{ fontWeight: 'bold', margin: 0, textTransform: 'uppercase', fontSize: '14px' }}>Публичное акционерное общество «Россети Волга»</h5>
                        <h6 style={{ fontWeight: 'bold', margin: '2px 0 0 0', fontSize: '13px' }}>Филиал ПАО «Россети Волга» — «Оренбургэнерго»</h6>
                        <div style={{ height: '1.5px', backgroundColor: '#000', width: '100%', marginTop: '6px', marginBottom: 15 }}></div>
                        <h4 style={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', margin: '10px 0' }}>ДОГОВОР ПОДРЯДА НА СМР № {calcData.contractNumber || '__________'}</h4>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontWeight: 'bold' }}>
                        <span>г. Оренбург</span>
                        <span>«{new Date().toLocaleDateString('ru-RU')}» г.</span>
                      </div>

                      <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                        Филиал Публичного акционерного общества <strong>«Россети Волга» — «Оренбургэнерго»</strong>, в лице зам. директора по капитальному строительству, действующего на основании Доверенности № 56-РА/2026, именуемый в дальнейшем <strong>«Подрядчик»</strong>, с одной стороны, и
                        <strong> {isOrganization ? `${calcData.clientName} в лице ${calcData.directorName || '______'} (ИНН: ${calcData.inn || '—'})` : `${calcData.individualName} (Паспорт: ${calcData.passportData || '—'})`}</strong>, именуемый в дальнейшем <strong>«Заказчик»</strong>, с другой стороны, заключили настоящий договор о нижеследующем:
                      </p>

                      <h6 style={{ fontWeight: 'bold', margin: '15px 0 5px 0' }}>1. ПРЕДМЕТ ДОГОВОРА</h6>
                      <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                        1.1. Подрядчик обязуется по заданию Заказчика выполнить комплекс строительно-монтажных работ на объекте по адресу: {calcData.address || '_________'}, а именно: <u>{calcData.workScope || '_________'}</u>, а Заказчик обязуется принять результат работ и оплатить его.
                      </p>
                      <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                        1.2. Основные технические параметры: уровень напряжения {calcData.voltageLevel || '—'} кВ, запрашиваемая мощность {calcData.powerRequested || '—'} кВт, протяженность линий {calcData.cableLength || '—'} км.
                      </p>

                      <h6 style={{ fontWeight: 'bold', margin: '15px 0 5px 0' }}>2. СТОИМОСТЬ РАБОТ И ПОРЯДОК РАСЧЕТОВ</h6>
                      <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                        2.1. Общая сметная стоимость по настоящему договору составляет <strong>{totalCost.toLocaleString('ru-RU')} рублей 00 копеек</strong>, в том числе:
                      </p>
                      <ul style={{ margin: '0 0 10px 25px', padding: 0 }}>
                        <li>Стоимость материалов и оборудования: {Number(calcData.materialsCost || 0).toLocaleString('ru-RU')} руб.</li>
                        <li>Стоимость строительно-монтажных работ: {Number(calcData.constructionCost || 0).toLocaleString('ru-RU')} руб.</li>
                        <li>НДС (20%): {vatCost.toLocaleString('ru-RU')} руб.</li>
                      </ul>

                      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 50, fontSize: '12px', borderTop: '1px solid #000', paddingTop: 15 }}>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>ПОДРЯДЧИК:</span>
                          <p style={{ margin: '4px 0' }}>Филиал ПАО «Россети Волга» — «Оренбургэнерго»</p>
                          <p style={{ marginTop: 30 }}>_______________________</p>
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>ЗАКАЗЧИК:</span>
                          <p style={{ margin: '4px 0' }}>{isOrganization ? calcData.clientName : calcData.individualName}</p>
                          <p style={{ marginTop: 30 }}>_______________________</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ДОКУМЕНТ: АКТ СТРОИТЕЛЬНОГО КОНТРОЛЯ */
                    <div>
                      <div style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold', color: '#475569', borderBottom: '1px solid #000', paddingBottom: 4 }}>
                        ПАО «РОССЕТИ ВОЛГА» · ОТДЕЛ КАПИТАЛЬНОГО СТРОИТЕЛЬСТВА И ТЕХНАДЗОРА
                      </div>

                      <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        <h4 style={{ margin: 0, fontWeight: 'bold' }}>АКТ СТРОИТЕЛЬНОГО КОНТРОЛЯ И ГОТОВНОСТИ ОБЪЕКТА</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>к проведению пусконаладочных работ по договору № {calcData.contractNumber || 'Б/Н'}</p>
                      </div>

                      <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                        Настоящий акт составлен представителем технадзора ПАО «Россети Волга» в том, что строительно-монтажные работы на объекте Заказчика (<strong>{isOrganization ? calcData.clientName : calcData.individualName}</strong>) по адресу <u>{calcData.address || '_________'}</u> выполнены в полном соответствии с утвержденным проектом.
                      </p>

                      <h6 style={{ fontWeight: 'bold', marginBottom: 6 }}>РЕЗУЛЬТАТЫ ПРОВЕРКИ СТРОИТЕЛЬНОЙ ГОТОВНОСТИ:</h6>
                      <ul style={{ paddingLeft: '20px', margin: '0 0 15px 0', lineHeight: '1.6' }}>
                        <li>Геометрия кабельных/воздушных трасс общей протяженностью <strong>{calcData.cableLength || '0'} км</strong> соответствует исполнительной документации.</li>
                        <li>Фундаменты под КТП/БКТП выполнены согласно СНиП, контур заземления проверен и соответствует нормам (не более 4 Ом для 10 кВ).</li>
                        <li>Объем СМР: <em>{calcData.workScope || 'не указан'}</em> принят без существенных замечаний. Объект готов к этапу индивидуальных испытаний РЗА и ПНР.</li>
                      </ul>

                      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <div>
                          <p><strong>Инспектор строительного контроля ПТО:</strong><br />Главный специалист отдела капстроительства ПО</p>
                          <p style={{ marginTop: 20 }}>Подпись: _________________ / {user?.name || 'Технадзор'} /</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p>Дата инспекции: {new Date().toLocaleDateString('ru-RU')}</p>
                          <p style={{ fontSize: '10px', color: '#64748B', margin: 0 }}>АСУ «Энергокапстрой»</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default ConstructionServicePage