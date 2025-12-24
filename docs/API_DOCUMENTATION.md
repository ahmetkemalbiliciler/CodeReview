# KodumunHatasi API Dokümantasyonu

> Frontend geliştiricileri için hazırlanmış kapsamlı API referansı

---

## 🌐 Genel Bilgiler

| Özellik            | Değer                       |
| ------------------ | --------------------------- |
| **Base URL**       | `http://localhost:3000/api` |
| **Content-Type**   | `application/json`          |
| **Authentication** | Bearer Token (JWT)          |

### Standart Response Formatı

Tüm endpoint'ler aşağıdaki formatta yanıt döner:

```typescript
interface ApiResponse<T> {
  success: boolean; // İşlem başarılı mı?
  data?: T; // Başarılıysa veri
  error?: string; // Hata durumunda mesaj
}
```

### Authentication Header

```http
Authorization: Bearer <access_token>
```

> ⚠️ `/api/auth/*` hariç tüm endpoint'ler authentication gerektirir.

---

## 🔐 Authentication Endpoints

**Base Path:** `/api/auth`

Bu endpoint'ler kullanıcı kayıt, giriş ve oturum yönetimi için kullanılır.

---

### POST `/api/auth/signup`

Yeni kullanıcı kaydı oluşturur. Supabase Auth kullanılarak email doğrulama gönderilir.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "min6chars"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "session": null,
    "message": "Check your email for verification link"
  }
}
```

**Errors:**
| Status | Mesaj |
|--------|-------|
| 400 | `Email and password are required` |
| 400 | Supabase error mesajı |

---

### POST `/api/auth/login`

Kullanıcı girişi yapar ve access token döner.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "xxx-refresh-token",
    "expires_at": 1703505600
  }
}
```

> 💡 **Frontend Kullanımı:** `access_token`'ı local storage'da sakla ve diğer API isteklerinde `Authorization: Bearer <token>` header'ı olarak gönder.

---

### GET `/api/auth/me`

Mevcut oturum açmış kullanıcının bilgilerini getirir.

**Headers:** `Authorization: Bearer <token>` (required)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 📁 Projects Endpoints

**Base Path:** `/api/projects`

Projeler, kullanıcının kod versiyonlarını grupladığı ana birimlerdir.

---

### POST `/api/projects`

Yeni proje oluşturur.

**Request Body:**

```json
{
  "name": "My Awesome Project",
  "description": "Projenin açıklaması (opsiyonel)"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Awesome Project",
    "description": "Projenin açıklaması",
    "ownerId": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### GET `/api/projects`

Kullanıcının tüm projelerini listeler.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Project 1",
      "description": "...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/projects/:id`

Tek bir proje detayını getirir.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Project",
    "description": "...",
    "ownerId": "user-uuid",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### DELETE `/api/projects/:id`

Projeyi ve ilişkili tüm verileri siler.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Project deleted successfully"
  }
}
```

---

## 📝 Versions Endpoints

**Base Path:** `/api/versions`

Kod versiyonları, bir projeye ait farklı kod durumlarını temsil eder. Her versiyon yüklendiğinde otomatik olarak AI analizi çalıştırılır.

> ⚠️ **Önemli:** Kaynak kodu (`sourceCode`) veritabanında SAKLANMAZ. Sadece AI analizine gönderilir ve unutulur.

---

### POST `/api/versions/project/:projectId`

Yeni kod versiyonu yükler ve otomatik analiz başlatır.

**URL Params:**

- `projectId`: Projenin UUID'si

**Request Body:**

```json
{
  "versionLabel": "v1.0.0",
  "sourceCode": "function hello() {\n  console.log('Hello World');\n}"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "version-uuid",
    "projectId": "project-uuid",
    "versionLabel": "v1.0.0",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "analysis": {
      "id": "analysis-uuid",
      "summary": "Kod genel olarak temiz, 2 potansiyel sorun bulundu.",
      "issues": [...]
    }
  }
}
```

> 💡 **Frontend Kullanımı:** Editor'dan alınan kodu doğrudan `sourceCode` alanına gönder. Büyük dosyalar için 10MB limit.

---

### GET `/api/versions/project/:projectId`

Bir projenin tüm versiyonlarını listeler.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "version-uuid",
      "projectId": "project-uuid",
      "versionLabel": "v1.0.0",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "version-uuid-2",
      "versionLabel": "v1.1.0",
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/versions/:id`

Tek bir versiyonun detaylı bilgisini analiz dahil getirir.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "version-uuid",
    "projectId": "project-uuid",
    "versionLabel": "v1.0.0",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "analysis": {
      "id": "analysis-uuid",
      "summary": "...",
      "issues": [...]
    }
  }
}
```

---

## 🔍 Analyses Endpoints

**Base Path:** `/api/analyses`

Analizler, AI tarafından üretilen kod kalitesi raporlarıdır. Her versiyon yüklemesinde otomatik çalışır ama manuel tetikleme de mümkündür.

---

### POST `/api/analyses/version/:versionId`

Bir versiyon için yeniden analiz başlatır.

> ⚠️ Versiyon zaten analiz edilmişse hata döner.

**Request Body:**

```json
{
  "sourceCode": "function hello() {...}"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "analysis-uuid",
    "codeVersionId": "version-uuid",
    "summary": "Genel analiz özeti...",
    "issues": [
      {
        "id": "issue-uuid",
        "issueCode": "NESTED_LOOP",
        "severity": "high",
        "complexity": "O_n2",
        "functionName": "processData",
        "startLine": 15,
        "endLine": 25,
        "beforeSnippet": "for (i) { for (j) { ... } }",
        "afterSnippet": "data.flatMap(x => x.process())"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### GET `/api/analyses/version/:versionId`

Bir versiyonun analiz sonuçlarını getirir.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "analysis-uuid",
    "summary": "Kod kalitesi iyi durumda.",
    "issues": [...]
  }
}
```

---

### Analysis Issue Tipleri

| Issue Code        | Açıklama                            |
| ----------------- | ----------------------------------- |
| `NESTED_LOOP`     | İç içe döngüler (performans sorunu) |
| `UNUSED_VARIABLE` | Kullanılmayan değişkenler           |
| `MAGIC_NUMBER`    | Açıklanmamış sabit sayılar          |
| `LONG_FUNCTION`   | Çok uzun fonksiyonlar               |
| `DUPLICATE_CODE`  | Tekrarlayan kod blokları            |

| Severity | Açıklama       |
| -------- | -------------- |
| `low`    | Düşük öncelik  |
| `medium` | Orta öncelik   |
| `high`   | Yüksek öncelik |

| Complexity | Big-O Notation  |
| ---------- | --------------- |
| `O_1`      | Sabit zaman     |
| `O_n`      | Lineer zaman    |
| `O_n2`     | Kuadratik zaman |

---

## 🔄 Comparisons Endpoints

**Base Path:** `/api/comparisons`

Karşılaştırmalar, iki versiyon arasındaki **deterministik** farkları hesaplar. AI burada kullanılmaz - sadece matematiksel karşılaştırma yapılır.

---

### POST `/api/comparisons/project/:projectId`

İki versiyonu karşılaştırır.

**Request Body:**

```json
{
  "fromVersionId": "eski-version-uuid",
  "toVersionId": "yeni-version-uuid"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "comparison-uuid",
    "projectId": "project-uuid",
    "fromAnalysisId": "analysis-1-uuid",
    "toAnalysisId": "analysis-2-uuid",
    "overallChange": "IMPROVED",
    "issueChanges": [
      {
        "issueCode": "NESTED_LOOP",
        "changeType": "IMPROVED",
        "fromCount": 3,
        "toCount": 1
      },
      {
        "issueCode": "MAGIC_NUMBER",
        "changeType": "WORSENED",
        "fromCount": 2,
        "toCount": 5
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

> 💡 **Frontend Kullanımı:** `overallChange` değerine göre yeşil (IMPROVED), gri (UNCHANGED), veya kırmızı (WORSENED) gösterebilirsin.

---

### GET `/api/comparisons/:id`

Karşılaştırma detayını getirir.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "comparison-uuid",
    "overallChange": "IMPROVED",
    "issueChanges": [...],
    "explanation": null
  }
}
```

---

### POST `/api/comparisons/:id/explain`

Karşılaştırma için AI tarafından insan dostu açıklama oluşturur.

> 💡 Bu endpoint **lazy loading** mantığıyla çalışır. Kullanıcı "Açıklama Göster" butonuna tıkladığında çağrılmalı.

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "explanation-uuid",
    "comparisonId": "comparison-uuid",
    "content": "Kodunuz önemli ölçüde iyileştirilmiş! İç içe döngü sayısı 3'ten 1'e düşürülmüş, bu da performansı O(n²)'den O(n)'e iyileştirmiş. Ancak bazı magic number'lar eklenmiş - bunları const olarak tanımlamanız önerilir.",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## ⚡ Health Check

### GET `/health`

Sunucu durumunu kontrol eder. Authentication gerektirmez.

**Response (200 OK):**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🎯 Frontend Geliştirme Akışı

### 1. Authentication Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Signup    │────▶│  Email Verify    │────▶│     Login       │
│  /signup    │     │   (Supabase)     │     │    /login       │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │ Store Token     │
                                             │ (localStorage)  │
                                             └─────────────────┘
```

### 2. Main Application Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Create     │────▶│  Upload Version  │────▶│  View Analysis  │
│  Project    │     │  (with code)     │     │   Results       │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                      │
                    ┌─────────────────────────────────┘
                    ▼
           ┌──────────────────┐     ┌─────────────────┐
           │  Compare Two     │────▶│  Get AI         │
           │  Versions        │     │  Explanation    │
           └──────────────────┘     └─────────────────┘
```

### 3. Örnek Fetch Kullanımı

```javascript
// API client helper
const API_BASE = "http://localhost:3000/api";

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data.data;
}

// Kullanım örnekleri
const projects = await apiCall("/projects");
const newProject = await apiCall("/projects", {
  method: "POST",
  body: JSON.stringify({ name: "My Project" }),
});
```

---

## 📋 HTTP Status Kodları

| Status | Anlamı                                |
| ------ | ------------------------------------- |
| 200    | OK - İstek başarılı                   |
| 201    | Created - Kaynak oluşturuldu          |
| 400    | Bad Request - Geçersiz istek          |
| 401    | Unauthorized - Token geçersiz/eksik   |
| 404    | Not Found - Kaynak bulunamadı         |
| 500    | Internal Server Error - Sunucu hatası |
