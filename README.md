# FarmSync

FarmSync is a full-stack web app for connecting crop sellers and buyers. Sellers can create crop listings, buyers can browse and purchase listings, and users can register/login with role-based views.

---

## Run Instructions from GitHub

### 1. Clone the Project

```bash
git clone YOUR_GITHUB_REPO_LINK
cd CS-250-Project
```

---

## Backend Setup

### 2. Go into the Backend Folder

```bash
cd Backend
```

### 3. Create a Virtual Environment

#### Mac/Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

#### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### 4. Install Backend Packages

```bash
pip install fastapi uvicorn sqlalchemy pydantic python-jose passlib bcrypt==4.0.1 requests python-multipart email-validator pandas joblib scikit-learn
```

### 5. Run the Backend

```bash
python -m uvicorn main:app --reload
```

The backend should now be running at:

```text
http://127.0.0.1:8000
```

You can also view the FastAPI docs at:

```text
http://127.0.0.1:8000/docs
```

Leave this terminal running, then open a new terminal window for the frontend.

---

## Frontend Setup

### 6. Go into the Frontend App Folder

From the project root:

```bash
cd frontend/FarmSync
```

If you are still inside the `Backend` folder, use:

```bash
cd ../frontend/FarmSync
```

### 7. Install Frontend Packages

```bash
npm install
```

### 8. Run the Frontend

```bash
npm run dev
```

The frontend should now be running at:

```text
http://localhost:5173
```

---

## Using the App

1. Open the frontend in your browser:

```text
http://localhost:5173
```

2. Register a new account.
3. Choose either a buyer or seller role.
4. Log in with your account.

### Seller Role

Sellers can:

- View the dashboard
- Create crop listings
- Manage their crop listings
- View marketplace listings

### Buyer Role

Buyers can:

- View the dashboard
- Browse the marketplace
- Buy available crop listings
- View their orders

---

## Important Notes

### Backend Must Be Running

The frontend depends on the backend API. If the backend is not running, login, registration, marketplace data, crop listings, and orders may not work.

### Localhost Means Your Own Computer

If another person is testing the app from their own laptop, `localhost` points to their laptop, not yours.

To share one backend across multiple devices on the same Wi-Fi network, the backend must run on your machine and the frontend must point to your local network IP address instead of `localhost`.

Example:

```text
http://192.168.1.25:8000
```

### Git Does Not Automatically Share Database Data

GitHub shares the code, but it does not automatically share live backend data like users, listings, or orders unless the database file is committed or everyone is connected to the same backend/database.

---

## Common Commands

### Check Git Status

```bash
git status
```

### Pull Latest Code

```bash
git pull
```

### Start Backend

```bash
cd Backend
source venv/bin/activate
python -m uvicorn main:app --reload
```

### Start Frontend

```bash
cd frontend/FarmSync
npm run dev
```

---

## Tech Stack

### Backend

- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic
- Python-Jose
- Passlib
- bcrypt
- pandas
- joblib
- scikit-learn

### Frontend

- React
- Vite
- npm
