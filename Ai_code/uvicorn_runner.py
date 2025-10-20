# uvicorn_runner.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",  # Points to the 'app' object in the 'app/main.py' file
        host="0.0.0.0",  # Makes the server accessible on your network
        port=8000,       # The standard port for FastAPI
        reload=True      # Enables auto-reload
    )