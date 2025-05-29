import requests
import json

def test_login():
    url = 'http://localhost:8000/api/auth/login/'
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    data = {
        'username': 'omar',
        'password': 'jaioublier'
    }
    
    try:
        print("Attempting to connect to:", url)
        print("Headers:", json.dumps(headers, indent=2))
        print("Data:", json.dumps(data, indent=2))
        
        # Convert data to JSON string
        json_data = json.dumps(data)
        print("\nJSON data being sent:", json_data)
        
        response = requests.post(url, headers=headers, data=json_data)
        
        print("\nResponse Status Code:", response.status_code)
        print("Response Headers:", dict(response.headers))
        print("Response Body:", response.text)
        
        if response.status_code == 200:
            print("\nLogin successful!")
            return response.json()
        else:
            print("\nLogin failed!")
            return None
            
    except requests.exceptions.ConnectionError as e:
        print("\nConnection Error:", str(e))
        print("Make sure the Django server is running on http://localhost:8000")
        return None
    except Exception as e:
        print("\nUnexpected error:", str(e))
        return None

if __name__ == '__main__':
    test_login() 