# Backend Configuration

The backend is now configured to serve both the API routes and the built frontend.

## Environment Variables

Create a `.env` file in this directory with the following variables:

```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/doc_workflow
JWT_SECRET=your-secret-key-should-be-changed-in-production
```

## Frontend Integration

The server is configured to:
1. Serve API routes at `/api/*`
2. Serve static frontend files from `../doc_frontend/build`
3. Route all non-API requests to the frontend SPA

## Running

Start the server with:
```
npm start
```

This will run the server on port 5001 (or the port specified in your .env file).