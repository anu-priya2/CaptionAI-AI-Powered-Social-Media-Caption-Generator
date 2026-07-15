import os
from pyngrok import ngrok
from app import app

def start_pipeline():
    # Retrieve the Ngrok auth token from the system environment if available
    token = os.environ.get("NGROK_AUTH_TOKEN", "3G5XrHn9sG6clnaM692aw6QyQ0c_4PvYxUWWg6tahZ1YeKLLq")
    
    # Configure the tunnel manager locally
    ngrok.set_auth_token(token)
    
    # Establish a clean HTTP tunnel mapped to the server port
    public_url = ngrok.connect(5000, "http")
    
    print("=" * 70)
    print("YOUR PUBLIC WEBSITE URL IS LIVE!")
    print(f"URL: {public_url}")
    print("=" * 70)

if __name__ == "__main__":
    # Initialize the tunnel prior to engine startup
    start_pipeline()
    
    # Run the server with debug set to False to prevent reloader conflicts
    app.run(debug=False, port=5000)