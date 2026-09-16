from fastapi.testclient import TestClient
from main import app
import os

client = TestClient(app)

def test_analyze():
    test_img_path = "test_raw.jpg"
    if not os.path.exists(test_img_path):
        print(f"Error: {test_img_path} not found.")
        return
        
    with open(test_img_path, "rb") as img:
        response = client.post(
            "/api/analyze",
            files={"file": ("test_raw.jpg", img, "image/jpeg")},
            data={"width": 10.0, "height": 10.0}
        )
        
    print("Response Status Code:", response.status_code)
    try:
        print("Response JSON:", response.json())
    except Exception as e:
        print("Response Content:", response.text)
        
if __name__ == "__main__":
    test_analyze()
