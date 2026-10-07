# CT Scan Analyzer Platform

An advanced web application for uploading, analyzing, and reporting on CT scans, featuring role-based access for doctors and patients. The app now includes a FastAPI inference service that loads the provided PyTorch `model.pth` and exposes it to the MERN stack.

## Project Overview

This platform facilitates the stroke detection workflow, allowing:

-   **Doctors and Radiologists** to upload CT scans, trigger AI analysis (mocked), view heatmaps/results, and generate diagnostic reports.
-   **Patients** to view their scan history, status, and download final reports.

The application is built with a modern React frontend and an Express.js backend.

## Architecture

-   **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Vite
-   **Backend**: Node.js, Express, Mock Data Layer (extensible to MongoDB/PostgreSQL)
-   **ML Service**: FastAPI, PyTorch, TorchVision, Pillow
-   **Authentication**: JWT-based Role-Based Access Control (RBAC)

## Project Structure

```text
CTScan_Analysis/
  backend/             Express API and upload proxy for predictions
  ml_service/          FastAPI PyTorch inference service
  src/                 React frontend
  model.pth            PyTorch model weights used by ml_service
```

## Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   Python 3.10+
-   npm or yarn

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd CTScan_Analysis
    ```

2.  **Install dependencies**:
    ```bash
    # Install backend dependencies
    cd backend
    npm install

    # Install frontend dependencies
    cd ..
    npm install
    ```

3.  **Install ML service dependencies**:
    ```bash
    cd ml_service
    python -m venv .venv
    .\.venv\Scripts\activate
    pip install -r requirements.txt
    ```

4.  **Start the ML Service**:
    ```bash
    cd ml_service
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    # Inference API starts on http://localhost:8000
    ```

5.  **Start the Backend**:
    ```bash
    cd backend
    npm run dev
    # Server starts on http://localhost:3001
    ```

6.  **Start the Frontend**:
    ```bash
    # In a new terminal, from the root directory
    npm run dev
    # Client starts on http://localhost:8080
    ```

## Usage

### Roles & Credentials (Mock)

-   **Doctor**: `dr.smith@hospital.com` / `password123`
-   **Patient**: `sarah.jones@email.com` / `password123`

### Features

-   **Secure Uploads**: Doctors can upload DICOM/image files (simulated).
-   **Automated Analysis**: Sends a CT slice through Express to FastAPI, runs PyTorch inference, and returns the predicted class with confidence.
-   **Reporting**: Generates PDF-ready reports with findings and recommendations.
-   **Dashboards**: Tailored views for medical professionals and patients.

## Development

-   **Frontend Code**: Located in `src/`
-   **Backend Code**: Located in `backend/`
-   **ML Service Code**: Located in `ml_service/`
-   **API Documentation**: A Postman collection is available in `postman/ct-scan-analyzer.postman_collection.json`.

### Prediction API

-   Frontend calls `POST http://localhost:3001/api/v1/predict`
-   Express accepts multipart field `image`, forwards it to `POST http://localhost:8000/predict`
-   FastAPI returns `predicted_class`, `confidence`, class probabilities, and processing time

The default label order is `Normal,Bleeding,Ischemia`. Override `CLASS_NAMES`
before starting FastAPI if the trained model used a different order:

```bash
$env:CLASS_NAMES="Normal,Bleeding,Ischemia"
uvicorn main:app --reload --port 8000
```

## License

Private and Confidential.
