# CT Scan Backend API

Backend API for the CT Scan Analysis Platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

The prediction route expects the FastAPI ML service to be running at
`http://localhost:8000`, or the URL configured by `ML_SERVICE_URL`.

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Scans
- `GET /api/v1/scans` - List scans (role-based)
- `GET /api/v1/scans/:id` - Get scan by ID
- `POST /api/v1/scans/upload` - Upload scan

### Prediction
- `POST /api/v1/predict` - Upload one image as multipart field `image` and proxy it to FastAPI inference

### Analysis
- `POST /api/v1/analysis/analyze/:scanId` - Trigger analysis
- `GET /api/v1/analysis/result/:scanId` - Get analysis result

### Reports
- `GET /api/v1/reports` - List reports (role-based)
- `GET /api/v1/reports/:id` - Get report by ID
- `GET /api/v1/reports/scan/:scanId` - Get report by scan ID
- `POST /api/v1/reports/generate` - Generate report (doctor only)

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics (role-based)

## Role-Based Access

- **Doctors/Radiologists**: Can upload scans, view their scans, generate reports
- **Patients**: Can view only their own reports

## Notes

This is a scaffold/mock implementation. In production:
- Replace mock data with database queries
- Implement proper file storage (S3, etc.)
- Implement proper password hashing
- Add refresh token rotation
- Add rate limiting
- Add input validation/sanitization
