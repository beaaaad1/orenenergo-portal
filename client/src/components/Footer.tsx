import homeIcon from '../assets/logo.svg'

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      background: '#0057A8',
      padding: '24px 128px',
      marginTop: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
            <img src={homeIcon} alt="logo" width={200} height={62} style={{margin: '10px 0', paddingBottom: '10px'}} />
          <p style={{ color: '#fff', fontWeight: 500, margin: 0, fontSize: 20 }}>
            Филиал ПАО "Россети Волга" — "Оренбургэнерго"
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, margin: '6px 0 0' }}>
            Корпоративный интранет-портал
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, margin: 0 }}>
            460000, г. Оренбург, ул. Маршала Жукова, 28
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, margin: '6px 0 0' }}>
            © {year} Оренбургэнерго. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer