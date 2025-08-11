# ⚽ Football Manager  

## 📌 Backend Setup  

```bash
cd football-manager-backend
```

1. Remove `.example` from the `.env` file and update values as needed (frontend URL, ports, DB credentials, etc.).  
2. Install dependencies:  
   ```bash
   npm i
   ```
3. Run migrations:  
   ```bash
   npx sequelize-cli db:migrate
   ```
4. Run the seeder:  
   ```bash
   npx sequelize-cli db:seed --seed 20250811-demo-data.js
   ```
   **(Running migration and seeder is mandatory)**  
5. Start the backend:  
   ```bash
   npm run dev
   ```

> **Note:** You should also need to set up Redis.

Note: I did a script for load test over the bullmq queue you can run it by write this command (node ./test.js)

💡 Important: Running migrations & seeder is mandatory before starting.
---

## 🎨 Frontend Setup  

```bash
cd football-manager-frontend
```

1. Remove `.example` from the `.env` file and update values as needed.  
2. Install dependencies:  
   ```bash
   npm i
   ```
3. Start the frontend:  
   ```bash
   npm run dev
   ```

---

## 📝 Contact  

If you face any issues during setup, please contact me at **tamarihamza4@gmail.com** —  
I’ll be more than happy to help.

---

## ⏱ Time Report  

| Section | Description | Time Spent |
|---------|-------------|------------|
| **Project Setup & Config** | Initializing backend & frontend projects, setting up Next.js, Express, Sequelize, Socket.IO, Redis integration, and environment variables | **3h** |
| **Database Design & Migrations** | Designing schema for users, teams, players, transfer listings, seeds for demo data, relationships, and constraints | **4h** |
| **Seeding Logic & Data Generation** | Creating a large-scale seeder (20 teams, 20 players per team, extra unassigned players, pre-listed players) | **3h** |
| **Backend API Development** | Building CRUD for teams, market listings, buying players, and applying business rules (min roster size, budget limit, unique players) | **6h** |
| **Team Auto-Drafting Logic** | Algorithm to assign players to new teams, budget constraints, and ensuring positional balance | **3h** |
| **Socket.IO Real-Time Updates** | Implementing socket events for “team ready” notifications and handling initialization issues | **2h** |
| **Frontend UI (Next.js)** | Market page, filters, buying flow, confirmation dialogs, responsive table & mobile cards | **5h** |
| **Authentication Flow** | Login/register, middleware route protection, logout button with confirmation | **2h** |
| **Testing & Debugging** | Manual API testing, frontend-backend integration tests, fixing logic & migration issues | **3h** |
| **Documentation & README** | Writing setup instructions, troubleshooting tips, and time report | **1h** |

**Total Estimated Time:** **32 hours** spread over multiple days.
