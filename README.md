# 📚 Интерактивный комплекс тестирования знаний иностранных языков

Веб-приложение для интерактивного тестирования знаний иностранных языков. Преподаватель загружает тесты из **Excel**, студенты проходят их в браузере, а система автоматически проверяет ответы и сохраняет результаты в **Supabase**.

---

## 🚀 Демо

[👉 Открыть демо](https://language-test-app-seven.vercel.app/)

---

## 📸 Скриншоты

> Изображения кладите в `docs/screenshots/` (имена — ниже).

### Вход и выбор роли
<img width="1080" alt="login" src="docs/screenshots/login.png" />

### Панель преподавателя
<img width="1090" alt="teacher-panel" src="docs/screenshots/teacher-panel.png" />

### Прохождение теста студентом
<img width="1090" alt="student-test" src="docs/screenshots/student-test.png" />

### Результаты и разбор ответов
<img width="1360" alt="teacher-results" src="docs/screenshots/teacher-results.png" />

---

## ✨ Возможности

- 👨‍🏫 **Режим преподавателя** — вход по паролю, загрузка и управление тестами
- 🔐 **Авторизация** — серверная проверка пароля + токен доступа
- 📊 **Тесты из Excel** — автоматическое преобразование таблицы в интерактивный тест
- 📝 **Типы вопросов** — варианты ответа, открытые, аудио и картинки
- ⏱️ **Таймер** — ограничение времени с автоотправкой
- 🚫 **Анти-чит** — фиксация уходов с вкладки и попыток покинуть страницу
- 👨‍🎓 **Режим студента** — прохождение доступных тестов без регистрации
- 📈 **Автопроверка** — подсчёт баллов и итогового результата
- 💾 **Сохранение результатов** — все результаты в базе данных
- 📱 **Адаптивный интерфейс** — ПК, планшеты и телефоны

---

## 🛠️ Стек технологий

- **Frontend:** React 19, TypeScript, Vite 6, React Router 7, Feature-Sliced Design, CSS
- **Backend:** Node.js 24, Express 5, Multer, xlsx, cors, dotenv
- **База данных:** Supabase (PostgreSQL)
- **Деплой:** Vercel

---

## 📦 Установка и запуск

**Требования:** Node.js 20+ (рекомендуется 24), npm.

```bash
# 1. Клонирование и зависимости
git clone <url-репозитория>
cd language-test-app
cd backend && npm install
cd ../frontend && npm install
```

**Переменные окружения.** Создайте `backend/.env`:

```env
SUPABASE_URL=https://<ваш-проект>.supabase.co
SUPABASE_KEY=<publishable-ключ>
ADMIN_PASSWORD=<пароль-преподавателя>
ADMIN_TOKEN_SECRET=<длинная-случайная-строка>
CORS_ORIGINS=http://localhost:5173,https://<ваш-домен>.vercel.app
```

и `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

**Запуск в двух терминалах:**

```bash
# Терминал 1 — бэкенд (http://localhost:8000)
cd backend
npm start

# Терминал 2 — фронтенд (http://localhost:5173)
cd frontend
npm run dev
```

Откройте **http://localhost:5173**.

> Вход преподавателя — пароль из `ADMIN_PASSWORD`. Таблицы `tests`, `questions`, `options`, `results` должны существовать в Supabase.
