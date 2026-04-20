import pool from './db'

const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'EMPLOYEE',
      department VARCHAR(255),
      phone VARCHAR(50),
      avatar VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS news (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      pinned BOOLEAN DEFAULT false,
      urgent BOOLEAN DEFAULT false,
      category VARCHAR(100) DEFAULT 'general',
      author_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      filepath VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      department VARCHAR(255),
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'NEW',
      priority VARCHAR(50) DEFAULT 'MEDIUM',
      author_id INTEGER REFERENCES users(id),
      assignee_id INTEGER REFERENCES users(id),
      deadline TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS vacations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      comment TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      date TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)

  console.log('Таблицы созданы успешно!')
  await pool.end()
}

createTables().catch(console.error)