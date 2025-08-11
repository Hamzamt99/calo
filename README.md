# ⚽ Running the Project (Backend + Frontend)

## 📋 Prerequisites
Before you start, make sure you have:
- **Node.js** ≥ 18  
- **MySQL** running and accessible
  
---

## 🚀 Backend Setup

```bash
# Go to backend directory
cd football-manager-backend

# 1️⃣ Configure environment
# Copy .env.example -> .env
# Remove ".example" and fill in your values:
# -----------------------------------------
# Example:
# PORT=3001
# DB_HOST=localhost
# DB_USER=root
# DB_PASS=yourpassword
# DB_NAME=football_manager
# FRONTEND_URL=http://localhost:3000
# REDIS_URL=redis://localhost:6379   # optional if using Redis adapter
# -----------------------------------------

# 📌 Note: You should have Redis installed locally if using it.

# 2️⃣ Install dependencies
npm i

# 3️⃣ Run migrations
npx sequelize-cli db:migrate

# 4️⃣ Seed the database (mandatory)
npx sequelize-cli db:seed --seed 20250811-demo-data.js

# 5️⃣ Start the backend server
npm run dev


💡 Important: Running migrations & seeder is mandatory before starting.


# Go to frontend directory
cd football-manager-frontend

# 1️⃣ Configure environment
# Copy .env.example -> .env.local
# Remove ".example" and fill in your values:
# -----------------------------------------
# Example:
# NEXT_PUBLIC_API_URL=http://localhost:3001
# NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
# -----------------------------------------

# 2️⃣ Install dependencies
npm i

# 3️⃣ Start the frontend server
npm run dev



🛠 Troubleshooting
🔹 Database errors?

Double-check .env values in the backend.

Make sure the DB exists & credentials are correct.

🔹 Frontend can't reach API?

Verify NEXT_PUBLIC_API_URL in .env.local.

Check backend CORS settings.

🔹 Changed env files?

Restart both servers after any .env update.

📞 Support
If you face any setup issues:
📧 Email: tamarihamza4@gmail.com — happy to help!
