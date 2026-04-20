import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import authRouter from './routes/auth'
import newsRouter from './routes/news'
import usersRouter from './routes/users'
import tasksRouter from './routes/tasks'
import vacationsRouter from './routes/vacations'
import eventsRouter from './routes/events'
import documentsRouter from './routes/documents'
import notificationsRouter from './routes/notifications'
import statsRouter from './routes/stats'
import searchRouter from './routes/search'
import supportRoutes from './routes/support';

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/', (req, res) => {
  res.json({ message: 'Сервер Оренбургэнерго работает!' })
})

app.use('/api/auth', authRouter)
app.use('/api/news', newsRouter)
app.use('/api/users', usersRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/vacations', vacationsRouter)
app.use('/api/events', eventsRouter)
app.use('/api/documents', documentsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/stats', statsRouter)
app.use('/api/search', searchRouter)
app.use('/api/support', supportRoutes);

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`)
})