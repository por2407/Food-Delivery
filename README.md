# 🚀 ระบบบริหารจัดการสั่งอาหาร (Food Delivery Management System)

แพลตฟอร์มสั่งอาหารแบบ Full-stack ที่พัฒนาด้วยสถาปัตยกรรมที่ทันสมัยและมีประสิทธิภาพสูง โปรเจกต์นี้เป็นการสาธิตระบบ Ecosystem ที่รองรับผู้ใช้งานหลายบทบาท (Multi-role) พร้อมการติดตามสถานะออเดอร์แบบ Real-time, ระบบจัดการสิทธิ์การเข้าถึง (RBAC), และหน้าจอที่ตอบสนอง (Responsive UI)

![React](https://img.shields.io/badge/React-19.0-blue)
![Go](https://img.shields.io/badge/Go-1.22+-00ADD8)
![Tailwind](https://img.shields.io/badge/Tailwind-v4.0-38bdf8)
![Fiber](https://img.shields.io/badge/Go_Fiber-v2-0085FF)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 📖 ภาพรวมโปรเจกต์ (Project Overview)

แพลตฟอร์มนี้เป็นตลาดกลาง (Marketplace) ที่เชื่อมโยงผู้ใช้งาน 3 กลุ่มหลักเข้าด้วยกัน:
1.  **ลูกค้า (Customers)**: ค้นหาร้านอาหาร, สั่งอาหาร และติดตามสถานะการจัดส่ง
2.  **เจ้าของร้านอาหาร (Restaurant Owners)**: จัดการโปรไฟล์ร้าน, เมนูอาหาร และจัดการออเดอร์ที่เข้ามา
3.  **ไรเดอร์ (Riders)**: รับออเดอร์ที่พร้อมส่ง และจัดการสถานะการรับ-ส่งอาหาร

ระบบถูกออกแบบมาให้รองรับการขยายตัว (Scalability) และการสื่อสารแบบ Real-time โดยใช้ **Go Fiber** เป็นเครื่องยนต์หลักในส่วน Backend และ **React 19** ร่วมกับ **Tailwind CSS v4** เพื่อมอบประสบการณ์การใช้งานระดับพรีเมียมในส่วน Frontend

---

## ✨ ฟีเจอร์หลัก (Key Features)

### 🛍️ สำหรับลูกค้า (Customer Experience)
- **การค้นหาร้านอาหาร**: ค้นหาและกรองร้านอาหารตามหมวดหมู่ประเภทอาหาร
- **การจัดการคำสั่งซื้อ**: ระบบตะกร้าสินค้าที่ครบถ้วน และการติดตามสถานะออเดอร์แบบ Real-time
- **ระบบรีวิว**: ให้คะแนนและเขียนรีวิวสำหรับร้านอาหารและเมนูต่างๆ
- **จัดการที่อยู่**: บันทึกที่อยู่จัดส่งได้หลายรายการ พร้อมระบบตั้งค่าที่อยู่เริ่มต้น
- **การแจ้งเตือน Real-time**: รับการอัปเดตสถานะออเดอร์ทันทีผ่าน WebSockets

### 🏪 สำหรับร้านอาหาร (Restaurant Dashboard)
- **ระบบจัดการร้าน**: เปิด/ปิดร้าน และจัดการข้อมูลโปรไฟล์ร้านค้า
- **จัดการเมนู (Menu Management)**: ระบบ CRUD เมนูอาหารที่สมบูรณ์ (เพิ่ม, แก้ไข, ลบ, แก้ไขราคา, สถานะพร้อมจำหน่าย)
- **กระบวนการจัดการออเดอร์**: จัดการสถานะออเดอร์ตั้งแต่ รับออเดอร์ (Accept) → เตรียมอาหาร (Prepare) → พร้อมส่ง (Ready)

### 🛵 สำหรับไรเดอร์ (Rider Portal)
- **คิวงานส่งอาหาร**: ดูรายการออเดอร์ที่เตรียมเสร็จแล้วและพร้อมรับไปส่ง
- **จัดการสถานะการส่ง**: อัปเดตสถานะ "รับอาหาร" (Picked Up) และ "ส่งสำเร็จ" (Delivered) พร้อมระบบบันทึกรายได้

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Backend
- **Core**: [Go](https://go.dev/) (Golang)
- **Framework**: [Fiber v2](https://gofiber.io/) - เว็บเฟรมเวิร์กที่มีประสิทธิภาพสูง
- **Database**: [PostgreSQL](https://www.postgresql.org/) พร้อม [GORM](https://gorm.io/) (ORM สำหรับจัดการฐานข้อมูล)
- **Caching & Pub/Sub**: [Redis](https://redis.io/) สำหรับการจัดการข้อมูลความเร็วสูงและเหตุการณ์แบบ Real-time
- **Authentication**: JWT (JSON Web Tokens) พร้อม Role-based Middleware
- **Real-time**: WebSockets สำหรับการอัปเดตสถานะออเดอร์ทันที

### Frontend
- **Framework**: [React 19](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Mapping**: [Leaflet](https://leafletjs.com/) สำหรับบริการจัดการพิกัดและแผนที่
- **Navigation**: [React Router v7](https://reactrouter.com/)

---

## 🏗️ สถาปัตยกรรมระบบ (System Architecture)

โปรเจกต์นี้ใช้รูปแบบสถาปัตยกรรมแบบ Clean Architecture ในส่วน Backend เพื่อความง่ายในการบำรุงรักษา:
- `cmd/`: จุดเริ่มต้น (Entry points) ของแอปพลิเคชัน
- `internal/core/domain/`: แหล่งรวม Entity และ Core Business Logic
- `internal/handlers/`: ตัวจัดการ HTTP Request และการกำหนดเส้นทาง (Routes)
- `pkg/`: ยูทิลิตี้และไลบรารีที่ใช้ร่วมกัน

---

## 🚦 เริ่มต้นใช้งาน (Getting Started)

### ความต้องการเบื้องต้น (Prerequisites)
- [Go 1.22+](https://go.dev/dl/)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Redis](https://redis.io/download/)

### ขั้นตอนการติดตั้ง

1. **Clone Repository**
   ```bash
   git clone https://github.com/por2407/Food-Delivery.git
   cd Food-Delivery
   ```

2. **การตั้งค่า Backend**
   ```bash
   cd backend
   # คัดลอกและตั้งค่า .env (ใส่ข้อมูล DB และ JWT Secret)
   go mod tidy
   go run cmd/main.go
   ```

3. **การตั้งค่า Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🔐 ข้อมูลตัวแปรสภาพแวดล้อม (Environment Variables)

### Backend (.env)
```env
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=food_delivery
DB_PORT=5432
JWT_SECRET=your_jwt_secret
REDIS_URL=localhost:6379
```

---

## 📄 ใบอนุญาต (License)

โปรเจกต์นี้อยู่ภายใต้ใบอนุญาต MIT

---

## 👨‍💻 ผู้พัฒนา (Developer)

**[ชื่อของคุณ]**  
*Full Stack Developer*  
- GitHub: [@por2407](https://github.com/por2407)
