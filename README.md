# 📚 Интерактивный комплекс тестирования знаний иностранных языков

Веб-приложение для интерактивного тестирования знаний иностранных языков. Преподаватель загружает тесты из **Excel**, студенты проходят их в браузере, а система автоматически проверяет ответы и сохраняет результаты в **Supabase**.

---

## 🚀 Демо

[👉 Открыть демо](https://language-test-app-seven.vercel.app/)

---

## 📸 Скриншоты

### Вход и выбор роли
<img width="1919" height="925" alt="Screenshot_1" src="https://github.com/user-attachments/assets/09d9a6c9-4bf5-4d3f-836e-b76880c90bf2" />

### Панель преподавателя
<img width="1906" height="930" alt="Screenshot_2" src="https://github.com/user-attachments/assets/2ad6b289-1ae7-4f16-bd05-8c659d44d638" />

### Прохождение теста студентом
<img width="1906" height="928" alt="Screenshot_3" src="https://github.com/user-attachments/assets/39544dd6-6c75-47a6-b3d5-a15c8681b159" />

### Результаты и разбор ответов
<img width="1907" height="933" alt="Screenshot_5" src="https://github.com/user-attachments/assets/d0b6ee74-9237-48f3-a26c-4005778e1cdc" />
<img width="1907" height="926" alt="Screenshot_4" src="https://github.com/user-attachments/assets/7fdfc74c-6ab2-48d5-9029-d05e68d7a0ff" />

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
- **База данных:** SQLite (локально) / Supabase — PostgreSQL (Vercel)
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

**Переменные окружения.** Локально по умолчанию используется **SQLite** — внешняя БД не нужна. Создайте `backend/.env`:

```env
ADMIN_PASSWORD=<пароль-преподавателя>
ADMIN_TOKEN_SECRET=<длинная-случайная-строка>
CORS_ORIGINS=http://localhost:5173

# Только для Supabase (Vercel):
# DB_PROVIDER=supabase
# SUPABASE_URL=https://<проект>.supabase.co
# SUPABASE_KEY=<publishable-ключ>
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
