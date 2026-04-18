import requests

url = "http://localhost:8001/predict"
data = {
    "pressure": 60,
    "flow_rate": 50,
    "temperature": 25,
    "vibration": 4,
    "rpm": 1500,
    "operational_hours": 200,
    "use_cnn": False
}

try:
    print("Testing ML API RF...")
    res = requests.post(url, json=data)
    print(res.text)

    print("Testing ML API CNN...")
    data["use_cnn"] = True
    res2 = requests.post(url, json=data)
    print(res2.text)
except Exception as e:
    print(f"Error: {e}")
