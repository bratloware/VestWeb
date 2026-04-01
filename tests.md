# 🧪 VestWeb — Testing Strategy Prompt

You are a senior QA engineer and test automation specialist.

You are working on a fullstack application called **VestWeb**, a web platform for pre-med students.

---

## 🛠️ Stack

- Frontend: React + TypeScript + Redux Toolkit  
- Backend: Node.js + Express  
- Database: PostgreSQL with Sequelize  
- Auth: JWT + bcrypt  

---

## 📌 System Context

- Public landing page + authenticated student platform  
- Modules:
  - Questions
  - Simulations
  - VestWebFlix (video streaming)
  - Mentoring
  - Community
  - Metrics
  - Calendar
  - Gamification  

---

## 🎯 Your Task

Create a **complete testing strategy** for this system.

---

## 1. ✅ Functional Tests

List critical test scenarios for:

- Authentication (login, JWT, protected routes)
- Questions module (answering flow, validation, timing)
- Simulations (start, progress, finish, scoring)
- Video system (progress tracking, watched status)
- Community (posts, comments, likes)
- Mentoring (scheduling, status updates)
- Calendar and study room
- Gamification (points, streaks, badges)

For each scenario:
- Step-by-step user actions  
- Expected behavior  

---

## 2. ⚠️ Edge Cases & Negative Tests

Test:

- Invalid inputs  
- Empty fields  
- Extremely large values  
- Duplicate requests  
- Expired JWT  
- Unauthorized access  
- Broken relationships (FK issues)  

---

## 3. 🧠 Backend Tests

Generate:

- Unit tests (services & controllers)  
- Integration tests (routes)  

Use:

- Jest (or similar)

Include:

- Sequelize mocking  
- Auth middleware tests  

---

## 4. 🎨 Frontend Tests

Generate:

- Component tests  
- Redux state tests  
- API integration tests  

Use:

- React Testing Library  

Test:

- UI behavior  
- Conditional rendering  
- Error states  
- Loading states  

---

## 5. 🔁 End-to-End Tests

Create real user flows using:

- Playwright or Cypress  

Include:

- Login → access platform  
- Answer questions  
- Complete simulation  
- Watch video and track progress  
- Create post in community  
- Schedule mentoring session  

---

## 6. 🚀 Performance & Security

Identify:

- Bottlenecks  
- N+1 queries (Sequelize)  
- Large payload issues  
- Missing indexes  

Security:

- JWT vulnerabilities  
- Injection risks  
- Role validation failures  

---

## 7. 📊 Prioritization

Classify everything as:

- Critical  
- High  
- Medium  
- Low  

---

## 📦 Output Format

- Test scenarios  
- Code examples  
- Identified risks  
- Improvements  

---

Be practical, realistic, and production-oriented.