# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

جميع الـ endpoints التي تتطلب authentication تحتاج إلى إرسال token في header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "123456",
  "full_name": "أحمد محمد",
  "student_number": "202310001",
  "phone": "07901234567",
  "department": "هندسة تقنيات الحاسوب",
  "year_level": 3
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "123456"
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## Books Endpoints

### Get All Books
```http
GET /api/books?category=علوم الحاسوب&search=react
```

### Get Book by ID
```http
GET /api/books/:id
```

### Create Book (Admin)
```http
POST /api/books
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "عنوان الكتاب",
  "author": "اسم المؤلف",
  "category": "علوم الحاسوب",
  "total_copies": 5,
  "available_copies": 3,
  "cover_image": <file>
}
```

### Update Book (Admin)
```http
PUT /api/books/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Delete Book (Admin)
```http
DELETE /api/books/:id
Authorization: Bearer <token>
```

---

## Lectures Endpoints

### Get All Lectures
```http
GET /api/lectures?day_of_week=السبت&department=علوم الحاسوب
```

### Get Lecture by ID
```http
GET /api/lectures/:id
```

### Create Lecture (Admin)
```http
POST /api/lectures
Authorization: Bearer <token>
Content-Type: application/json

{
  "course_code": "CS101",
  "course_name": "برمجة الويب",
  "instructor_name": "د. علي محمد",
  "room_number": "A101",
  "day_of_week": "السبت",
  "start_time": "08:00",
  "end_time": "09:30",
  "credits": 3,
  "department": "علوم الحاسوب",
  "semester": 1
}
```

---

## Attendance Endpoints

### Get Attendance Records
```http
GET /api/attendance?student_id=<id>&date=2024-02-25
Authorization: Bearer <token>
```

### Create Attendance
```http
POST /api/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-02-25",
  "check_in_time": "08:02:10",
  "check_out_time": "12:00:00",
  "nfc_card_id": "NFC_1001",
  "status": "present",
  "lecture_id": "<lecture_id>"
}
```

---

## Payments Endpoints

### Get All Payments
```http
GET /api/payments?status=pending
Authorization: Bearer <token>
```

### Get Payment by ID
```http
GET /api/payments/:id
Authorization: Bearer <token>
```

### Create Payment (Admin)
```http
POST /api/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "student_id": "<student_id>",
  "amount": 1500000,
  "due_date": "2024-03-20",
  "semester": "الفصل الأول 2023-2024",
  "type": "رسوم دراسية"
}
```

---

## News Endpoints

### Get All News
```http
GET /api/news?type=event
```

### Get News by ID
```http
GET /api/news/:id
```

### Create News (Admin)
```http
POST /api/news
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "عنوان الخبر",
  "content": "محتوى الخبر",
  "type": "news",
  "news_image": <file>,
  "event_date": "2024-03-15",
  "location": "المكان",
  "organizer": "المنظم"
}
```

---

## Borrowings Endpoints

### Get All Borrowings
```http
GET /api/borrowings?status=active
Authorization: Bearer <token>
```

### Create Borrowing
```http
POST /api/borrowings
Authorization: Bearer <token>
Content-Type: application/json

{
  "book_id": "<book_id>"
}
```

### Return Book
```http
PUT /api/borrowings/:id/return
Authorization: Bearer <token>
```

---

## Students Endpoints

### Get All Students (Admin)
```http
GET /api/students?department=علوم الحاسوب&year_level=3
Authorization: Bearer <token>
```

### Get Current Student
```http
GET /api/students/me
Authorization: Bearer <token>
```

### Update Current Student
```http
PUT /api/students/me
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "phone": "07901234567",
  "avatar": <file>
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "count": 10
}
```

### Error Response
```json
{
  "success": false,
  "message": "رسالة الخطأ",
  "error": "تفاصيل الخطأ"
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

