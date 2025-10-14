# Timamu FlaskFrontend

This is the frontend for the Timamu application built with React, Vite, and TailwindCSS. It interacts with the Flask backend API.

## Features

- Authentication (Login/Register)
- Role-based dashboards (Patient, Therapist, Admin)
- Protected routes
- Responsive design with TailwindCSS

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd FlaskFrontend
   npm install
   ```

3. Create a `.env` file in the root directory with:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_MEDIASOUP_URL=http://localhost:3001
   VITE_APP_NAME=Timamu
   VITE_APP_ENV=development
   ```
   
   Or copy from the example:
   ```bash
   cp .env.example .env
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Technology Stack

- React
- Vite
- TailwindCSS
- React Router
- Zustand (State Management)
- Axios
