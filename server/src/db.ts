import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'orenenergo_db',
  user: 'postgres',
  password: 'admin',
})

export default pool