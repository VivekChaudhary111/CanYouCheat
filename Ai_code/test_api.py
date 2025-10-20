import requests
import base64
import json
import os

# --- Configuration ---
API_URL = "http://localhost:8000/proctor"
IMAGE_PATH = r"c:\Users\Gaurav Kumar\Documents\photo.jpg" # <-- IMPORTANT: Change this to your image file name

# --- Function to encode image to base64 ---
def image_to_base64(filepath):
    """Reads an image file and returns its base64 encoded string."""
    try:
        with open(filepath, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except FileNotFoundError:
        print(f"Error: Image file not found at '{filepath}'")
        return None
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None

# --- Main Test ---
if __name__ == "__main__":
    print(f"Attempting to test API endpoint: {API_URL}")
    print(f"Using image: {IMAGE_PATH}")

    # Check if image file exists
    if not os.path.exists(IMAGE_PATH):
        print(f"\nFATAL ERROR: Test image '{IMAGE_PATH}' does not exist in the current directory.")
        exit() # Stop the script if image is missing

    # 1. Encode the image
    base64_image_string = image_to_base64(IMAGE_PATH)

    if base64_image_string:
        # 2. Prepare the JSON payload
        payload = {"image": base64_image_string}

        # 3. Send the POST request
        print("\nSending POST request to the AI service...")
        try:
            response = requests.post(API_URL, json=payload, timeout=30) # Added timeout

            # 4. Check the response
            response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)

            print("\nRequest successful!")
            print(f"Status Code: {response.status_code}")

            # 5. Print the JSON response (flags)
            try:
                flags = response.json()
                print("Response JSON (Proctoring Flags):")
                print(json.dumps(flags, indent=2))
            except json.JSONDecodeError:
                print("Error: Could not decode JSON response.")
                print("Raw response text:", response.text)

        except requests.exceptions.ConnectionError:
            print(f"\nError: Could not connect to the server at {API_URL}.")
            print("Please ensure the FastAPI server is running.")
        except requests.exceptions.Timeout:
             print("\nError: The request timed out.")
        except requests.exceptions.RequestException as e:
            print(f"\nAn error occurred during the request: {e}")
            if e.response is not None:
                print("Server response:", e.response.text)
    else:
        print("\nCould not encode image. Aborting test.")