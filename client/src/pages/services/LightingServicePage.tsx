import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import Swal from 'sweetalert2'

const LightingServicePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Управление открытием конкретного документа: 'contract' | 'order' | null
  const [activeDoc, setActiveDoc] = useState<'contract' | 'order' | null>(null)

  // Переключатель типа заявителя: true = Юр. лицо, false = Физ. лицо
  const [isOrganization, setIsOrganization] = useState<boolean>(true)

  // Все поля инициализированы пустыми строками для полностью ручного ввода
  const [calcData, setCalcData] = useState({
    // Реквизиты физлица
    individualName: '',

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

    // Договорные параметры
    contractNumber: '',
    warrantyMonths: '',

    // Техническая спецификация объекта
    lightsCount: '',
    lightPower: '',
    lightsModel: '',
    poleType: '',
    wireLength: '',
    wireType: '',
    shunoType: '',

    // Сметный расчет
    equipmentCost: '',
    workCost: ''
  })

  // Безопасная калькуляция сметы (обработка пустых строк)
  const totalCost = Number(calcData.equipmentCost || 0) + Number(calcData.workCost || 0)
  const vatCost = Math.round(totalCost * 0.20)
  const pureCost = totalCost - vatCost

  const handlePrint = () => {
    window.print()
  }

  // Локальное скачивание сгенерированного файла в браузере
  const downloadGeneratedFile = (title: string, content: string, defaultExt = 'html') => {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${title}.${defaultExt}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Автоматическая отправка на бэкенд в существующий архив и локальное скачивание
  const handleApproveAndSaveToArchive = async (docType: 'Договор' | 'Заявление-Наряд') => {
    try {
      // 1. Извлекаем HTML-содержимое печатной области
      const docHtmlElement = document.getElementById(docType === 'Договор' ? 'contract-print-area' : 'order-print-area')
      if (!docHtmlElement) {
        Swal.fire('Ошибка', 'Не удалось собрать данные печатной формы', 'error')
        return
      }

      const fullHtmlContent = `<html><head><meta charset="utf-8"><title>${docType}</title></head><body>${docHtmlElement.innerHTML}</body></html>`
      const generatedFilename = `${docType === 'Договор' ? 'dogovor' : 'zayavlenie'}_no_${calcData.contractNumber || Date.now()}.html`

      // 2. Создаем виртуальный файл в формате HTML из строки для отправки через Multer
      const htmlBlob = new Blob([fullHtmlContent], { type: 'text/html;charset=utf-8;' })
      const virtualFile = new File([htmlBlob], generatedFilename, { type: 'text/html' })

      // 3. Формируем FormData под требования вашего бэкенда (upload.single('file'))
      const formData = new FormData()
      formData.append('file', virtualFile)

      formData.append('title', `${docType} наружного освещения № ${calcData.contractNumber || 'Б/Н'}`)

      // ИСПРАВЛЕНИЕ ТУТ: Разделяем категории в зависимости от типа создаваемого документа
      if (docType === 'Договор') {
        formData.append('category', 'contract') // Пойдет в Договоры
      } else {
        formData.append('category', 'order')    // Пойдет в Приказы/Заявления/Наряды
      }

      formData.append('department', 'СКС Центрального РЭС')

      // 4. Отправляем на ваш стандартный рабочий POST-роут
      await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // 5. Локальное скачивание на компьютер пользователя
      downloadGeneratedFile(`${docType}_${calcData.contractNumber || 'Документ'}`, fullHtmlContent)

      Swal.fire({
        title: 'Успешно сохранено!',
        text: `${docType} добавлен в общий архив системы и скачан на ваше устройство.`,
        icon: 'success',
        confirmButtonColor: '#0057A8'
      })

      // Закрываем окно предпросмотра
      setActiveDoc(null)
    } catch (err: any) {
      console.error('Ошибка при сохранении документа:', err)
      const serverMessage = err.response?.data?.message || 'Сервер отклонил запрос или формат файла заблокирован.'
      Swal.fire('Ошибка сохранения', serverMessage, 'error')
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ background: '#F4F7FA', minHeight: '100vh', padding: '20px 0' }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 20px' }}>

          {/* Возврат */}
          <div className="d-print-none" style={{ marginBottom: 15 }}>
            <button
              onClick={() => navigate('/contracts')}
              className="btn btn-link p-0 text-decoration-none"
              style={{ color: '#0057A8', fontWeight: 500 }}
            >
              ← Вернуться в панель договоров
            </button>
          </div>

          {/* Шапка */}
          <div className="d-print-none shadow-sm" style={{ background: '#10B981', color: '#fff', padding: '24px', borderRadius: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 36 }}>💡</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700 }}>Технологическая карта: Наружное освещение</h4>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: 13 }}>
                  Формирование договоров подряда и нарядов СМР «Оренбургэнерго»
                </p>
              </div>
            </div>
          </div>

          {/* ====================================================================== */}
          {/* СНАЧАЛА ИДЕТ ЭТОТ ТЕКСТ (ИНЖЕНЕРНО-ПРОИЗВОДСТВЕННЫЕ РЕГЛАМЕНТЫ)         */}
          {/* ====================================================================== */}
          <div className="d-print-none card shadow-sm border-0 p-4 mb-4" style={{ borderRadius: 12, backgroundColor: '#fff' }}>
            <h5 style={{ fontWeight: 700, color: '#0057A8', borderBottom: '2px solid #E2E8F0', paddingBottom: 10, marginBottom: 15 }}>
              🛡️ Инженерно-производственные регламенты по освещению
            </h5>

            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '8px', height: '100%', borderLeft: '4px solid #0057A8' }}>
                  <h6 style={{ fontWeight: 700, color: '#1A2B3C' }}>1. Спецификация оборудования и энергоэффективность</h6>
                  <p className="text-muted small mb-0" style={{ lineHeight: '1.5' }}>
                    При монтаже уличного освещения использовать консольные светодиодные светильники класса энергоэффективности не ниже А+ (тип ДКУ/ЖКУ) со световой отдачей не менее 130 лм/Вт. Корпус должен обладать пылевлагозащитой уровня не менее IP66 для противодействия климатическим условиям Оренбургской области.
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '8px', height: '100%', borderLeft: '4px solid #F5A623' }}>
                  <h6 style={{ fontWeight: 700, color: '#1A2B3C' }}>2. Автоматизация и шкафы управления (ШУНО)</h6>
                  <p className="text-muted small mb-0" style={{ lineHeight: '1.5' }}>
                    Ввод питания осуществлять через шкафы управления наружным освещением типа И-710 или ШУНО. В обязательном порядке интегрировать астрономический таймер или выносное фотореле с настраиваемым порогом срабатывания (5-20 Лк) и встроенной задержкой от ложных срабатываний (от фар автомобилей).
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '8px', height: '100%', borderLeft: '4px solid #10B981' }}>
                  <h6 style={{ fontWeight: 700, color: '#1A2B3C' }}>3. Требования к подвесу провода и безопасности</h6>
                  <p className="text-muted small mb-0" style={{ lineHeight: '1.5' }}>
                    Монтаж линии выполнять изолированным проводом СИП-4 4х16 или 4х25. Расстояние от нижнего провода до полотна проезжей части при максимальном провисе должно составлять не менее 5.0 метров. Все металлические кронштейны светильников подлежат обязательному заземлению на нулевой провод линии.
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* ====================================================================== */}
          {/* А УЖЕ ЗА НИМ НИЖЕ НАХОДЯТСЯ ВСЕ ПОЛЯ ДЛЯ ЗАПОЛНЕНИЯ                     */}
          {/* ====================================================================== */}
          <div className="d-print-none row g-4 mb-4">

            {/* Форма ввода */}
            <div className="col-12 col-lg-7">
              <div className="card shadow-sm border-0 p-4" style={{ borderRadius: 12, backgroundColor: '#fff' }}>
                <h5 style={{ fontWeight: 700, color: '#1A2B3C', borderBottom: '2px solid #F0F4F8', paddingBottom: 10, marginBottom: 20 }}>
                  📝 Ввод реквизитов организации и технических параметров
                </h5>

                {/* Переключатель типа заявителя */}
                <div className="mb-4 p-3 rounded" style={{ background: '#F1F5F9' }}>
                  <label className="form-label fw-bold small text-secondary d-block mb-2">ТИП ЗАЯВИТЕЛЯ (КЛИЕНТА)</label>
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm ${!isOrganization ? 'btn-primary fw-bold' : 'btn-outline-primary'}`}
                      onClick={() => setIsOrganization(false)}
                    >
                      👤 Физическое лицо
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${isOrganization ? 'btn-primary fw-bold' : 'btn-outline-primary'}`}
                      onClick={() => setIsOrganization(true)}
                    >
                      🏢 Юридическое лицо / Мун. заказчик
                    </button>
                  </div>
                </div>

                <div className="row g-3">

                  {/* ПОЛЯ ДЛЯ ФИЗЛИЦА */}
                  {!isOrganization && (
                    <div className="col-12">
                      <label className="form-label fw-bold small text-secondary mb-1">ФИО ЗАЯВИТЕЛЯ (ПОЛНОСТЬЮ)</label>
                      <input type="text" className="form-control form-control-sm" placeholder="Например: Иванов Сергей Петрович" value={calcData.individualName} onChange={e => setCalcData({...calcData, individualName: e.target.value})} />
                    </div>
                  )}

                  {/* ПОЛЯ ДЛЯ ЮРЛИЦА */}
                  {isOrganization && (
                    <>
                      <div className="col-12">
                        <label className="form-label fw-bold small text-secondary mb-1">НАИМЕНОВАНИЕ МУНИЦИПАЛЬНОГО ЗАКАЗЧИКА / ЮР. ЛИЦА</label>
                        <input type="text" className="form-control form-control-sm" placeholder="Например: Администрация Сакмарского сельсовета" value={calcData.clientName} onChange={e => setCalcData({...calcData, clientName: e.target.value})} />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-bold small text-secondary mb-1">ИНН</label>
                        <input type="text" className="form-control form-control-sm" value={calcData.inn} onChange={e => setCalcData({...calcData, inn: e.target.value})} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold small text-secondary mb-1">КПП</label>
                        <input type="text" className="form-control form-control-sm" value={calcData.kpp} onChange={e => setCalcData({...calcData, kpp: e.target.value})} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold small text-secondary mb-1">ОГРН</label>
                        <input type="text" className="form-control form-control-sm" value={calcData.ogrn} onChange={e => setCalcData({...calcData, ogrn: e.target.value})} />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-secondary mb-1">ДОЛЖНОСТЬ РУКОВОДИТЕЛЯ</label>
                        <input type="text" className="form-control form-control-sm" placeholder="Глава сельсовета / Директор" value={calcData.directorTitle} onChange={e => setCalcData({...calcData, directorTitle: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-secondary mb-1">ФИО РУКОВОДИТЕЛЯ (В РОД. ПАДЕЖЕ)</label>
                        <input type="text" className="form-control form-control-sm" placeholder="Петрова Александра Ивановича" value={calcData.directorName} onChange={e => setCalcData({...calcData, directorName: e.target.value})} />
                      </div>
                    </>
                  )}

                  {/* ОБЩИЕ ПАРАМЕТРЫ ДЛЯ ОБЕИХ КАТЕГОРИЙ */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary mb-1">КОНТАКТНЫЙ ТЕЛЕФОН</label>
                    <input type="text" className="form-control form-control-sm" value={calcData.phone} onChange={e => setCalcData({...calcData, phone: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary mb-1">E-MAIL</label>
                    <input type="email" className="form-control form-control-sm" value={calcData.email} onChange={e => setCalcData({...calcData, email: e.target.value})} />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary mb-1">АДРЕС ПРОЕКТИРУЕМОЙ ТРАССЫ ОСВЕЩЕНИЯ</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Укажите область, район, улицу" value={calcData.address} onChange={e => setCalcData({...calcData, address: e.target.value})} />
                  </div>

                  <div className="col-12"><hr className="my-2" /></div>

                  {/* ТЕХНИЧЕСКИЙ БЛОК */}
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-secondary mb-1">МАРКА СВЕТИЛЬНИКА</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Например: ДКУ-150" value={calcData.lightsModel} onChange={e => setCalcData({...calcData, lightsModel: e.target.value})} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-secondary mb-1">КОЛ-ВО СВЕТИЛЬНИКОВ</label>
                    <input type="number" className="form-control form-control-sm" value={calcData.lightsCount} onChange={e => setCalcData({...calcData, lightsCount: e.target.value})} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-secondary mb-1">МОЩНОСТЬ (ВТ)</label>
                    <input type="number" className="form-control form-control-sm" value={calcData.lightPower} onChange={e => setCalcData({...calcData, lightPower: e.target.value})} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary mb-1">МАРКА СИП-ПРОВОДА</label>
                    <input type="text" className="form-control form-control-sm" placeholder="СИП-4 4х16" value={calcData.wireType} onChange={e => setCalcData({...calcData, wireType: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary mb-1">ПРОТЯЖЕННОСТЬ ЛИНИИ (М)</label>
                    <input type="number" className="form-control form-control-sm" value={calcData.wireLength} onChange={e => setCalcData({...calcData, wireLength: e.target.value})} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary mb-1">ТИП ШКАФА УПРАВЛЕНИЯ (ШУНО)</label>
                    <input type="text" className="form-control form-control-sm" placeholder="ШУНО И-710" value={calcData.shunoType} onChange={e => setCalcData({...calcData, shunoType: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary mb-1">НОМЕР ДОГОВОРА / СМЕТЫ</label>
                    <input type="text" className="form-control form-control-sm" placeholder="РОССЕТИ-НО-2026-..." value={calcData.contractNumber} onChange={e => setCalcData({...calcData, contractNumber: e.target.value})} />
                  </div>

                  <div className="col-md-8">
                    <label className="form-label fw-bold small text-secondary mb-1">ТИП ОПОР И СИСТЕМА КРЕПЛЕНИЯ</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Опоры ЖБ типа СВ-95" value={calcData.poleType} onChange={e => setCalcData({...calcData, poleType: e.target.value})} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-secondary mb-1">ГАРАНТИЯ (МЕСЯЦЕВ)</label>
                    <input type="number" className="form-control form-control-sm" placeholder="36" value={calcData.warrantyMonths} onChange={e => setCalcData({...calcData, warrantyMonths: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            {/* Финансы и генерация */}
            <div className="col-12 col-lg-5 d-flex flex-column gap-4">
              <div className="card shadow-sm border-0 p-4 bg-white" style={{ borderRadius: 12 }}>
                <h5 style={{ fontWeight: 700, color: '#1A2B3C', borderBottom: '2px solid #F0F4F8', paddingBottom: 10, marginBottom: 15 }}>
                  📊 Финансовый расчет стоимости
                </h5>

                <div className="mb-3">
                  <label className="form-label fw-bold small text-secondary mb-1">СТОИМОСТЬ ОБОРУДОВАНИЯ (РУБ)</label>
                  <input type="number" className="form-control" value={calcData.equipmentCost} onChange={e => setCalcData({...calcData, equipmentCost: e.target.value})} />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold small text-secondary mb-1">СТОИМОСТЬ МОНТАЖНЫХ РАБОТ (РУБ)</label>
                  <input type="number" className="form-control" value={calcData.workCost} onChange={e => setCalcData({...calcData, workCost: e.target.value})} />
                </div>

                <div className="p-3 bg-light rounded border">
                  <div className="d-flex justify-content-between mb-1 small text-muted">
                    <span>Без НДС:</span>
                    <span>{pureCost.toLocaleString('ru-RU')} руб.</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small text-muted">
                    <span>НДС (20%):</span>
                    <span>{vatCost.toLocaleString('ru-RU')} руб.</span>
                  </div>
                  <div className="d-flex justify-content-between pt-2 border-top fw-bold text-dark fs-5">
                    <span>ИТОГО СМЕТА:</span>
                    <span className="text-success">{totalCost.toLocaleString('ru-RU')} руб.</span>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm border-0 p-4 bg-white" style={{ borderRadius: 12 }}>
                <h5 style={{ fontWeight: 700, color: '#1A2B3C', marginBottom: 15 }}>
                  ⚙️ Generation официальных бланков
                </h5>
                <p className="text-muted small">После генерации документ откроется для предпросмотра. Вы сможете сохранить его в архив и скачать.</p>

                <div className="d-flex flex-column gap-2">
                  <button
                    onClick={() => setActiveDoc('contract')}
                    className="btn btn-primary w-100 py-2 fw-bold"
                    style={{ background: '#0057A8' }}
                  >
                    📜 Сформировать Договор подряда НО
                  </button>
                  <button
                    onClick={() => setActiveDoc('order')}
                    className="btn btn-warning w-100 py-2 fw-bold text-dark"
                    style={{ background: '#E67E22', border: 'none' }}
                  >
                    📝 Сформировать Заявление-Наряд СМР
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Стили для вывода на печать */}
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-modal-overlay { background: transparent !important; position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
              .print-document, .print-document * { visibility: visible; }
              .print-document { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; padding: 0mm !important; color: #000 !important; }
              .d-print-none { display: none !important; }
            }
          `}</style>

          {/* ====================================================================== */}
          {/* ПРОСМОТР БЛАНКА 1: ДОГОВОР ПОДРЯДА                                      */}
          {/* ====================================================================== */}
          {activeDoc === 'contract' && (
            <div className="print-modal-overlay" style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center',
              overflowY: 'auto', padding: '20px 0'
            }}>
              <div className="print-document bg-white text-dark" style={{
                width: '100%', maxWidth: '850px', height: 'fit-content',
                padding: '50px 60px', borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '1.5', textAlign: 'justify'
              }}>

                <div className="d-print-none d-flex justify-content-between mb-4 border-bottom pb-3" style={{ fontFamily: 'sans-serif' }}>
                  <div className="d-flex gap-2">
                    <button onClick={handlePrint} className="btn btn-sm btn-primary fw-bold">🖨️ Печать</button>
                    <button onClick={() => handleApproveAndSaveToArchive('Договор')} className="btn btn-sm btn-success fw-bold">💾 В архив и Скачать</button>
                  </div>
                  <button onClick={() => setActiveDoc(null)} className="btn btn-sm btn-danger">Закрыть</button>
                </div>

                <div id="contract-print-area">
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h5 style={{ fontWeight: 'bold', margin: 0 }}>ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО «РОССЕТИ ВОЛГА»</h5>
                    <h6 style={{ fontWeight: 'bold', margin: '4px 0 0 0' }}>Филиал ПАО «Россети Волга» — «Оренбургэнерго»</h6>
                    <div style={{ height: '2px', backgroundColor: '#000', width: '100%', marginTop: '10px', marginBottom: '15px' }}></div>
                    <h4 style={{ fontWeight: 'bold', marginTop: '15px', textTransform: 'uppercase' }}>ДОГОВОР ПОДРЯДА № {calcData.contractNumber || '[НОМЕР НЕ УКАЗАН]'}</h4>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>на выполнение строительно-монтажных работ по устройству систем наружного освещения</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontWeight: 'bold' }}>
                    <span>г. Оренбург</span>
                    <span>«{new Date().toLocaleDateString('ru-RU')}» г.</span>
                  </div>

                  <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                    Филиал Публичного акционерного общества <strong>«Россети Волга» — «Оренбургэнерго»</strong>, именуемый в дальнейшем <strong>«Подрядчик»</strong>, в лице директора филиала <strong>Кажаева Виктора Федоровича</strong>, действующего на основании Доверенности № 56-АА/2025-11 от 12.12.2025 г., с одной стороны, и
                    {isOrganization ? (
                      <>
                        {' '}корпоративный заказчик в лице организации <strong>{calcData.clientName || '[НАИМЕНОВАНИЕ ОРГАНИЗАЦИИ]'}</strong> (ИНН: {calcData.inn || '—'}, КПП: {calcData.kpp || '—'}, ОГРН: {calcData.ogrn || '—'}), в лице должностного лица — {calcData.directorTitle || '[Должность]'} <strong>{calcData.directorName || '[ФИО Руководителя]'}</strong>
                      </>
                    ) : (
                      <>
                        {' '}гражданин(ка) <strong>{calcData.individualName || '[ФИО Физического лица]'}</strong>, паспортные данные предоставлены при подаче заявки в АСУ
                      </>
                    )}
                    , с другой стороны, совместно именуемые «Стороны», заключили настоящий Договор о нижеследующем:
                  </p>

                  <h5 style={{ fontWeight: 'bold', margin: '15px 0 5px 0' }}>1. ПРЕДМЕТ ДОГОВОРА</h5>
                  <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                    1.1. Заказчик поручает, а Подрядчик принимает на себя обязательства по выполнению строительно-монтажных и пусконаладочных работ по возведению и модернизации объектов инфраструктуры наружного уличного освещения по адресу: {calcData.address || '[Адрес объекта не заполнен]'}.
                  </p>
                  <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                    1.2. Объем выполняемых работ включает в себя: монтаж кронштейнов на {calcData.poleType || 'опоры ВЛ'}, подвес самонесущего изолированного провода марки <strong>{calcData.wireType || '—'}</strong> протяженностью <strong>{calcData.wireLength || '0'} метров</strong>, монтаж и подключение энергосберегающих светильников марки <strong>{calcData.lightsModel || '—'}</strong> в количестве <strong>{calcData.lightsCount || '0'} штук</strong> единичной мощностью {calcData.lightPower || '0'} Вт, а также пусконаладку шкафа управления типа <strong>{calcData.shunoType || '—'}</strong>.
                  </p>

                  <h5 style={{ fontWeight: 'bold', margin: '15px 0 5px 0' }}>2. СТОИМОСТЬ РАБОТ И ПОРЯДОК РАСЧЕТОВ</h5>
                  <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                    2.1. Полная сметная стоимость работ по настоящему Договору составляет: <strong>{totalCost.toLocaleString('ru-RU')} рублей 00 копеек</strong>, включая материалы и оборудование стоимостью {Number(calcData.equipmentCost || 0).toLocaleString('ru-RU')} руб., и строительно-монтажные услуги в размере {Number(calcData.workCost || 0).toLocaleString('ru-RU')} руб.
                  </p>
                  <p style={{ textIndent: '25px', margin: '0 0 10px 0' }}>
                    2.2. Базовая сумма договора без учета налога: {pureCost.toLocaleString('ru-RU')} руб. Сумма налога НДС (20%): {vatCost.toLocaleString('ru-RU')} руб. Гарантия на установленное оборудование составляет {calcData.warrantyMonths || '0'} месяцев.
                  </p>

                  <h5 style={{ fontWeight: 'bold', margin: '20px 0 5px 0' }}>ЮРИДИЧЕСКИЕ РЕКВИЗИТЫ И ПОДПИСИ СТОРОН</h5>
                  <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', fontSize: '12px', borderTop: '1px solid #000', paddingTop: '15px' }}>
                    <div>
                      <h6><strong>ПОДРЯДЧИК:</strong></h6>
                      <p style={{ margin: '2px 0' }}><strong>Филиал ПАО «Россети Волга» — «Оренбургэнерго»</strong></p>
                      <p style={{ margin: '2px 0' }}>460024, г. Оренбург, ул. Маршала Жукова, д. 44</p>
                      <p style={{ marginTop: '20px' }}>Директор филиала: ___________ / Кажаев В.Ф. /</p>
                    </div>
                    <div>
                      <h6><strong>ЗАКАЗЧИК:</strong></h6>
                      {isOrganization ? (
                        <>
                          <p style={{ margin: '2px 0' }}><strong>Организация: {calcData.clientName || '—'}</strong></p>
                          <p style={{ margin: '2px 0' }}>ИНН/КПП: {calcData.inn || '—'} / {calcData.kpp || '—'}</p>
                          <p style={{ margin: '2px 0' }}>Тел / E-mail: {calcData.phone || '—'} / {calcData.email || '—'}</p>
                          <p style={{ marginTop: '20px' }}>{calcData.directorTitle || 'Уполномоченное лицо'}: ________________ / {calcData.directorName || '—'} /</p>
                        </>
                      ) : (
                        <>
                          <p style={{ margin: '2px 0' }}><strong>Физ. лицо: {calcData.individualName || '—'}</strong></p>
                          <p style={{ margin: '2px 0' }}>Контактный тел: {calcData.phone || '—'}</p>
                          <p style={{ margin: '2px 0' }}>E-mail: {calcData.email || '—'}</p>
                          <p style={{ marginTop: '35px' }}>Подпись заказчика: ________________ / ___________ /</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* ПРОСМОТР БЛАНКА 2: ЗАЯВЛЕНИЕ-НАРЯД СМР                                  */}
          {/* ====================================================================== */}
          {activeDoc === 'order' && (
            <div className="print-modal-overlay" style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center',
              overflowY: 'auto', padding: '20px 0'
            }}>
              <div className="print-document bg-white text-dark" style={{
                width: '100%', maxWidth: '850px', height: 'fit-content',
                padding: '50px 60px', borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                fontFamily: 'Arial, sans-serif', fontSize: '13px', lineHeight: '1.4', textAlign: 'justify'
              }}>

                <div className="d-print-none d-flex justify-content-between mb-4 border-bottom pb-3">
                  <div className="d-flex gap-2">
                    <button onClick={handlePrint} className="btn btn-sm btn-warning text-dark fw-bold">🖨️ Печать наряда</button>
                    <button onClick={() => handleApproveAndSaveToArchive('Заявление-Наряд')} className="btn btn-sm btn-success fw-bold">💾 В архив и Скачать</button>
                  </div>
                  <button onClick={() => setActiveDoc(null)} className="btn btn-sm btn-danger">Закрыть</button>
                </div>

                <div id="order-print-area">
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#444' }}>ПАО «РОССЕТИ ВОЛГА» · СЛУЖБА КАПИТАЛЬНОГО СТРОИТЕЛЬСТВА</div>

                  <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <h4 style={{ margin: 0, fontWeight: 'bold' }}>ЗАЗАЯВЛЕНИЕ-НАРЯД № НО-{calcData.contractNumber.split('-')[3] || '___'}</h4>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', fontSize: '12px' }}>на проведение строительно-монтажных работ систем наружного освещения трассы</p>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '12px', border: '1px solid #CBD5E1', marginBottom: '15px' }}>
                    <strong>Заказчик проекта:</strong> {isOrganization ? `${calcData.clientName || '—'} (ИНН: ${calcData.inn || '—'})` : `${calcData.individualName || '—'} (Физическое лицо)`}<br />
                    <strong>Место проведения СМР:</strong> {calcData.address || '—'}<br />
                    <strong>Основание:</strong> Договор строительного подряда № {calcData.contractNumber || 'Б/Н'}
                  </div>

                  <h5 style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '3px', textTransform: 'uppercase' }}>I. ТЕХНИЧЕСКАЯ СПЕЦИФИКАЦИЯ МАТЕРИАЛОВ</h5>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9' }}>
                        <th style={{ border: '1px solid #000', padding: '6px' }}>Наименование оборудования</th>
                        <th style={{ border: '1px solid #000', padding: '6px' }}>Утвержденные параметры спецификации</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>Опоры освещения</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{calcData.poleType || '—'}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>Провод магистральный</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{calcData.wireType || '—'} — длина {calcData.wireLength || '0'} метров</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>Светильники светодиодные</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{calcData.lightsModel || '—'} ({calcData.lightPower || '0'} Вт) — {calcData.lightsCount || '0'} ед.</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>Шкаф автоматики ШУНО</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{calcData.shunoType || '—'} (Выделенный бюджет: {Number(calcData.equipmentCost || 0).toLocaleString('ru-RU')} руб.)</td>
                      </tr>
                    </tbody>
                  </table>

                  <h5 style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>II. Инженерно-производственные регламенты по освещению</h5>

                  <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                    <strong>1. Спецификация оборудования и энергоэффективность</strong><br />
                    При монтаже уличного освещения использовать консольные светодиодные светильники класса энергоэффективности не ниже А+ (тип ДКУ/ЖКУ) со световой отдачей не менее 130 лм/Вт. Корпус должен обладать пылевлагозащитой уровня не менее IP66 для противодействия климатическим условиям Оренбургской области.
                  </div>

                  <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                    <strong>2. Автоматизация и шкафы управления (ШУНО)</strong><br />
                    Ввод питания осуществлять через шкафы управления наружным освещением типа И-710 или ШУНО. В обязательном порядке интегрировать астрономический таймер или выносное фотореле с настраиваемым порогом срабатывания (5-20 Лк) и встроенной задержкой от ложных срабатываний (от фар автомобилей).
                  </div>

                  <div style={{ fontSize: '12px', marginBottom: '15px' }}>
                    <strong>3. Требования к подвесу провода и безопасности</strong><br />
                    Монтаж линии выполнять изолированным проводом СИП-4 4х16 или 4х25. Расстояние от нижнего провода до полотна проезжей части при максимальном провисе должно составлять не менее 5.0 метров. Все металлические кронштейны светильников подлежат обязательному заземлению на нулевой провод линии.
                  </div>

                  <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div>
                      <p><strong>Распоряжение выдал:</strong><br />Главный инженер Центрального РЭС</p>
                      <p style={{ marginTop: '15px' }}>Подпись: _________________ / {user?.name || 'Системный программист'} /</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p>Дата формирования в АСУ: {new Date().toLocaleDateString('ru-RU')}</p>
                    </div>
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

export default LightingServicePage