import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import Swal from 'sweetalert2'

const PowerShareServicePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Управление открытием конкретного документа: 'contract' | 'order' | null
  const [activeDoc, setActiveDoc] = useState<'contract' | 'order' | null>(null)

  // Переключатель типа заявителя: true = Юр. лицо, false = Физ. лицо
  const [isOrganization, setIsOrganization] = useState<boolean>(true)

  // Все поля инициализированы пустыми строками для полностью ручного ввода (как на базовых страницах)
  const [calcData, setCalcData] = useState({
    // Реквизиты физлица (Получатель / Донор в зависимости от контекста, здесь как общие стороны)
    individualName: '',
    passportData: '',

    // Реквизиты контрагента (Юр. лица)
    clientName: '',
    inn: '',
    kpp: '',
    ogrn: '',
    directorName: '',
    directorTitle: 'Директора',

    // Данные стороны-донора (передающей мощность)
    donorName: '',
    donorInn: '',

    // Общие параметры объекта и сделки
    address: '',
    cadastralNumber: '',
    reallocatedPower: '', // кВт для передачи
    contractNumber: '',
    substationName: '',
    adminFee: '12500', // Нормативный сбор
    inspectionCost: '8000' // Выезд инспекции
  })

  const totalCost = Number(calcData.adminFee || 0) + Number(calcData.inspectionCost || 0)
  const vatCost = Math.round(totalCost * 0.20) // НДС 20%
  const pureCost = totalCost - vatCost

  const handlePrint = () => {
    window.print()
  }

  // Сборка HTML бланка и отправка файла + вызов бэкенд-эндпоинта
  const handleSaveAndApprove = async (docType: 'Соглашение' | 'Распоряжение', category: 'contract' | 'application') => {
    try {
      const docElement = document.getElementById('printable-document-content')
      if (!docElement) return

      // Формируем чистый HTML документ со стилями Times New Roman для архива
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
      const filename = `${category}_powershare_${Date.now()}.html`
      const file = new File([blob], filename, { type: 'text/html' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', `${docType} ТП: ${calcData.contractNumber || 'Б/Н'} (${isOrganization ? calcData.clientName : calcData.individualName})`)
      formData.append('category', category)
      formData.append('department', 'Служба балансов и учета лимитов')

      // 1. Сохраняем сгенерированный файл бланка в АСУ Договоры/Заявления
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // 2. Проводим операцию по бэкенд эндпоинту бизнес-логики заявки
      await api.post('/service-requests/powershare/approve', {
        ...calcData,
        docType,
        isOrganization,
        recipientFinalName: isOrganization ? calcData.clientName : calcData.individualName
      })

      Swal.fire({
        icon: 'success',
        title: 'Успешно проведено!',
        text: `Документ "${docType}" успешно сохранен в базу данных (раздел «${category === 'contract' ? 'Договоры' : 'Заявления'}») и направлен в ЕРЦ.`,
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

          {/* Корпоративная плашка Изумрудная */}
          <div className="d-print-none shadow-sm" style={{ background: '#10B981', color: '#fff', padding: '24px', borderRadius: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 36 }}>🔄</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700 }}>Перераспределение мощности (Технологическая карта)</h4>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: 13 }}>
                  Интерфейс переоформления актов технологического присоединения и лимитов мощности между потребителями · ПАО «Россети Волга»
                </p>
              </div>
            </div>
          </div>

          {/* Сетка модулей */}
          <div className="d-print-none" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: 20, marginBottom: 24 }}>

            {/* Левый блок: Инженерный протокол */}
            <div className="bg-white p-4 rounded-4 shadow-sm border-0">
              <h5 style={{ fontWeight: 700, color: '#1E293B', borderBottom: '2px solid #E2E8F0', paddingBottom: 10, marginBottom: 15 }}>
                📝 Инженерный регламент оценки сети
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14, lineHeight: '1.6' }}>
                <div>
                  <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>1. Выгрузка профилей ИС «Пирамида-Сети»</strong>
                  <span className="text-muted">
                    Проверить получасовые интервалы максимумов нагрузки Донора (<strong>{calcData.donorName}</strong>). Величина отчуждения <strong>{calcData.reallocatedPower || '0'} кВт</strong> не должна приводить к перегрузке смежных абонентов.
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>2. Технический аудит ТП / КТП</strong>
                  <span className="text-muted">
                    Проверить пропускную способность фидеров в границах питающего центра <u>{calcData.substationName || 'не указан'}</u> для исключения падения уровней напряжения ниже ГОСТ 32144-2013.
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#0057A8', display: 'block', marginBottom: 4 }}>3. Измерительные комплексы учета</strong>
                  <span className="text-muted">
                    Выдать предписание на замену или параметризацию приборов учета под новые лимиты потребления с последующей опломбировкой роторными пломбами РЭС.
                  </span>
                </div>
              </div>
            </div>

            {/* Правый блок: Двухвкладочная форма ввода */}
            <div className="bg-white p-4 rounded-4 shadow-sm border-0 d-flex flex-column justify-content-between">
              <div>
                {/* Переключатель типа лица как на других страницах */}
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
                    👤 Физическое лицо
                  </button>
                </div>

                <h6 style={{ fontWeight: 700, color: '#334155', marginBottom: 12 }}>Параметры Стороны-Получателя:</h6>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  {isOrganization ? (
                    <>
                      <div>
                        <label className="fw-semibold text-secondary mb-1">Наименование организации получателя</label>
                        <input type="text" className="form-control form-control-sm rounded-2" placeholder='ООО "Альфа-Сервис"' value={calcData.clientName} onChange={e => setCalcData({...calcData, clientName: e.target.value})} />
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
                          <input type="text" className="form-control form-control-sm rounded-2" placeholder="Иванов И.И." value={calcData.directorName} onChange={e => setCalcData({...calcData, directorName: e.target.value})} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="fw-semibold text-secondary mb-1">ФИО Физического лица</label>
                        <input type="text" className="form-control form-control-sm rounded-2" placeholder="Сидоров Василий Владимирович" value={calcData.individualName} onChange={e => setCalcData({...calcData, individualName: e.target.value})} />
                      </div>
                      <div>
                        <label className="fw-semibold text-secondary mb-1">Паспортные данные (Серия, номер, кем выдан)</label>
                        <input type="text" className="form-control form-control-sm rounded-2" placeholder="Серия 5600 № 123456 выдан УМВД..." value={calcData.passportData} onChange={e => setCalcData({...calcData, passportData: e.target.value})} />
                      </div>
                    </>
                  )}

                  <hr className="my-2" />
                  <h6 style={{ fontWeight: 700, color: '#334155', margin: '4px 0' }}>Технические параметры & Донор:</h6>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="fw-semibold text-secondary mb-1">Наименование Донора</label>
                      <input type="text" className="form-control form-control-sm rounded-2" value={calcData.donorName} onChange={e => setCalcData({...calcData, donorName: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="fw-semibold text-secondary mb-1">ИНН / КПП Донора</label>
                      <input type="text" className="form-control form-control-sm rounded-2" value={calcData.donorInn} onChange={e => setCalcData({...calcData, donorInn: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="fw-semibold text-secondary mb-1">Адрес объектов перераспределения</label>
                    <input type="text" className="form-control form-control-sm rounded-2" placeholder="г. Оренбург, проезд Автоматики, д. 12" value={calcData.address} onChange={e => setCalcData({...calcData, address: e.target.value})} />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="fw-semibold text-secondary mb-1">№ Соглашения ТП</label>
                      <input type="text" className="form-control form-control-sm rounded-2" placeholder="РОССЕТИ-ПЕР-2026-077" value={calcData.contractNumber} onChange={e => setCalcData({...calcData, contractNumber: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="fw-semibold text-secondary mb-1">Кадастровый номер</label>
                      <input type="text" className="form-control form-control-sm rounded-2" placeholder="56:44:0301002:88" value={calcData.cadastralNumber} onChange={e => setCalcData({...calcData, cadastralNumber: e.target.value})} />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="fw-semibold text-secondary mb-1">Передаваемая P (кВт)</label>
                      <input type="number" className="form-control form-control-sm rounded-2" placeholder="50" value={calcData.reallocatedPower} onChange={e => setCalcData({...calcData, reallocatedPower: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="fw-semibold text-secondary mb-1">Питающий центр (ТП/ПС)</label>
                      <input type="text" className="form-control form-control-sm rounded-2" placeholder="ПС 110 кВ Пригородная" value={calcData.substationName} onChange={e => setCalcData({...calcData, substationName: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Расчёт стоимости и генерация */}
              <div className="border-top pt-3 mt-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>Итого сбор по регламенту:</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>{totalCost.toLocaleString('ru-RU')} руб.</span>
                </div>

                <div className="d-flex flex-column gap-2">
                  <button onClick={() => setActiveDoc('contract')} className="btn text-white w-100 py-2 rounded-3" style={{ backgroundColor: '#0057A8', fontWeight: 600, fontSize: '13px' }}>
                    📜 Создать Трехстороннее Соглашение ТП (Категория Договоры)
                  </button>
                  <button onClick={() => setActiveDoc('order')} className="btn text-white w-100 py-2 rounded-3" style={{ backgroundColor: '#E67E22', fontWeight: 600, fontSize: '13px' }}>
                    ⚙️ Создать Распоряжение-Заявление на лимиты (Категория Заявления)
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

                {/* Панель управления над бланком */}
                <div className="d-print-none d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                  <div>
                    <button onClick={handlePrint} className="btn btn-sm btn-dark px-3 me-2 rounded-3">
                      🖨️ Печать бланка
                    </button>
                    <button
                      onClick={() => handleSaveAndApprove(activeDoc === 'contract' ? 'Соглашение' : 'Распоряжение', activeDoc === 'contract' ? 'contract' : 'application')}
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

                {/* Селектор контента бланка */}
                <div id="printable-document-content" style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '1.5', textAlign: 'justify' }}>

                  {activeDoc === 'contract' ? (
                    /* ДОКУМЕНТ: СОГЛАШЕНИЕ ПЕРЕРАСПРЕДЕЛЕНИЯ МОЩНОСТИ */
                    <div>
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <h5 style={{ fontWeight: 'bold', margin: 0, textTransform: 'uppercase', fontSize: '14px' }}>Публичное акционерное общество «Россети Волга»</h5>
                        <h6 style={{ fontWeight: 'bold', margin: '2px 0 0 0', fontSize: '13px' }}>Филиал ПАО «Россети Волга» — «Оренбургэнерго»</h6>
                        <div style={{ height: '1.5px', backgroundColor: '#000', width: '100%', marginTop: '6px', marginBottom: 15 }}></div>
                        <h4 style={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', margin: '10px 0' }}>СОГЛАШЕНИЕ № {calcData.contractNumber || '__________'}</h4>
                        <h5 style={{ fontWeight: 'bold', fontSize: '13px' }}>о перераспределении максимальной мощности между потребителями электрической энергии</h5>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontWeight: 'bold' }}>
                        <span>г. Оренбург</span>
                        <span>«{new Date().toLocaleDateString('ru-RU')}» г.</span>
                      </div>

                      <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                        Филиал Публичного акционерного общества <strong>«Россети Волга» — «Оренбургэнерго»</strong>, в лице директора филиала <strong>Кажаева Виктора Федоровича</strong>, действующего на основании Доверенности № 56-АА/2025-11, именуемый в дальнейшем <strong>«Сетевая организация»</strong>, с первой стороны, юридическое лицо <strong>{calcData.donorName || '_________'}</strong>, именуемое в дальнейшем <strong>«Лицо, передающее мощность» (Донор)</strong>, со второй стороны, и
                        <strong> {isOrganization ? `${calcData.clientName} (ИНН: ${calcData.inn || '—'})` : `${calcData.individualName} (Паспорт: ${calcData.passportData || '—'})`}</strong>, именуемое в дальнейшем <strong>«Лицо, принимающее мощность» (Получатель)</strong>, с третьей стороны, заключили настоящее Соглашение о нижеследующем:
                      </p>

                      <h6 style={{ fontWeight: 'bold', margin: '15px 0 5px 0' }}>1. ПРЕДМЕТ СОГЛАШЕНИЯ</h6>
                      <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                        1.1. Донор добровольно отказывается от части своей величины максимальной разрешенной мощности в объеме <strong>{calcData.reallocatedPower || '0'} кВт</strong> в пользу Получателя в границах питающего центра: <u>{calcData.substationName || '_________'}</u>.
                      </p>
                      <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                        1.2. Адрес объектов Сторон: {calcData.address || '_________'}, Кадастровый номер: {calcData.cadastralNumber || '_________'}.
                      </p>

                      <h6 style={{ fontWeight: 'bold', margin: '15px 0 5px 0' }}>2. СТОИМОСТЬ ПРОЦЕДУРЫ</h6>
                      <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                        2.1. Нормативная стоимость выполнения процедур переоформления техусловий составляет: <strong>{totalCost.toLocaleString('ru-RU')} рублей 00 копеек</strong> (в т.ч. НДС 20%: {vatCost.toLocaleString('ru-RU')} руб.). Чистая стоимость: {pureCost.toLocaleString('ru-RU')} руб.
                      </p>

                      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, fontSize: '11px', borderTop: '1px solid #000', paddingTop: 15 }}>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>СЕТЕВАЯ ОРГАНИЗАЦИЯ:</span>
                          <p style={{ margin: '4px 0' }}>ПАО «Россети Волга»</p>
                          <p style={{ marginTop: 25 }}>__________ / Кажаев В.Ф. /</p>
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>ДОНОР:</span>
                          <p style={{ margin: '4px 0' }}>{calcData.donorName}</p>
                          <p style={{ marginTop: 35 }}>_______________________</p>
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>ПОЛУЧАТЕЛЬ:</span>
                          <p style={{ margin: '4px 0' }}>{isOrganization ? calcData.clientName : calcData.individualName}</p>
                          <p style={{ marginTop: 35 }}>_______________________</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ДОКУМЕНТ: РАСПОРЯЖЕНИЕ-ЗАЯВЛЕНИЕ В СЛУЖБУ УЧЕТА ЛИМИТОВ */
                    <div>
                      <div style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold', color: '#475569', borderBottom: '1px solid #000', paddingBottom: 4 }}>
                        ПАО «РОССЕТИ ВОЛГА» · СЛУЖБА БАЛАНСОВ И УЧЕТА ЛИМИТОВ ЭЛЕКТРОЭНЕРГИИ
                      </div>

                      <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        <h4 style={{ margin: 0, fontWeight: 'bold' }}>ВНУТРЕННЕЕ РАСПОРЯЖЕНИЕ № Р-ПЕР-{calcData.contractNumber.split('-').pop() || '00'}</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>Об изменении технических лимитов мощности в базах данных АСКУЭ</p>
                      </div>

                      <div style={{ background: '#F8FAFC', padding: '12px', border: '1px solid #CBD5E1', marginBottom: 20, fontSize: '12px' }}>
                        <strong>Основание:</strong> Зарегистрированное соглашение перераспределения № {calcData.contractNumber || 'Б/Н'}<br />
                        <strong>Центр нагрузок:</strong> {calcData.substationName || '_________'}
                      </div>

                      <h6 style={{ fontWeight: 'bold', marginBottom: 8 }}>ТАБЛИЦА ИЗМЕНЕНИЯ ТЕХНИЧЕСКИХ ЛИМИТОВ:</h6>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F1F5F9' }}>
                            <th style={{ border: '1px solid #000', padding: '6px' }}>Абонент (Потребитель)</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Статус / Роль</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Объем корректировки</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ border: '1px solid #000', padding: '6px' }}>{calcData.donorName}</td>
                            <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', color: '#DC2626', fontWeight: 'bold' }}>Передающий (Донор)</td>
                            <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>-{calcData.reallocatedPower || '0'} кВт</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid #000', padding: '6px' }}>
                              {isOrganization ? calcData.clientName : calcData.individualName}
                            </td>
                            <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', color: '#16A34A', fontWeight: 'bold' }}>Принимающий (Получатель)</td>
                            <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>+{calcData.reallocatedPower || '0'} кВт</td>
                          </tr>
                        </tbody>
                      </table>

                      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <div>
                          <p><strong>Распоряжение выдал:</strong><br />Ведущий инженер службы учета лимитов</p>
                          <p style={{ marginTop: 20 }}>Подпись: _________________ / {user?.name || 'Системный оператор'} /</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p>Дата обработки в АСУ: {new Date().toLocaleDateString('ru-RU')}</p>
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

export default PowerShareServicePage