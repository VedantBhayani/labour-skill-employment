# Labour Skill Employment Analytics Backend API

This is the backend API server for the Labour Skill Employment Analytics application.

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory with the following content:
   ```
   PORT=5000
   NODE_ENV=development
   ```

## Running the Server

### Development Mode
To run the server in development mode with hot reloading:
```
npm run dev
```

### Production Mode
To run the server in production mode:
```
npm start
```

## API Endpoints

### Analytics Endpoints

#### Predictions
- `GET /api/analytics/predictions` - Get all predictions
- `GET /api/analytics/predictions/:id` - Get a specific prediction
- `POST /api/analytics/predictions` - Create a new prediction
- `DELETE /api/analytics/predictions/:id` - Delete a prediction

#### Scheduled Reports
- `GET /api/analytics/reports` - Get all scheduled reports
- `GET /api/analytics/reports/:id` - Get a specific report
- `POST /api/analytics/reports` - Create a new report
- `PUT /api/analytics/reports/:id` - Update a report
- `DELETE /api/analytics/reports/:id` - Delete a report
- `POST /api/analytics/reports/:id/run` - Run a report manually

#### Dashboards
- `GET /api/analytics/dashboards` - Get all dashboards
- `GET /api/analytics/dashboards/:id` - Get a specific dashboard
- `POST /api/analytics/dashboards` - Create a new dashboard
- `PUT /api/analytics/dashboards/:id` - Update a dashboard
- `DELETE /api/analytics/dashboards/:id` - Delete a dashboard

#### Department Analytics
- `GET /api/analytics/performance` - Get department performance metrics
- `GET /api/analytics/workload` - Get workload distribution metrics
- `GET /api/analytics/efficiency` - Get efficiency metrics
- `GET /api/analytics/skills` - Get skills analysis metrics

### Health Check
- `GET /api/health` - Check if the server is running 