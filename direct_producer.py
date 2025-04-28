import time
import random
from datetime import datetime
import requests

# InfluxDB configuration
INFLUXDB_HOST = "influxdb"
INFLUXDB_PORT = 8086
INFLUXDB_DATABASE = "healthtrend"
INFLUXDB_USERNAME = "admin"
INFLUXDB_PASSWORD = "adminpassword"

def generate_heart_rate():
    return {
        'patient_id': '12345',
        'heart_rate': random.randint(60, 100),
        'timestamp': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    }

def write_to_influxdb(data):
    url = f'http://{INFLUXDB_HOST}:{INFLUXDB_PORT}/write'
    params = {
        'db': INFLUXDB_DATABASE,
        'u': INFLUXDB_USERNAME,
        'p': INFLUXDB_PASSWORD
    }
    
    # Format data in line protocol
    timestamp = int(datetime.strptime(data['timestamp'], '%Y-%m-%dT%H:%M:%SZ').timestamp() * 1000000000)
    line = f'heart_rates,patient_id={data["patient_id"]} value={data["heart_rate"]} {timestamp}'
    
    try:
        response = requests.post(url, params=params, data=line)
        if response.status_code == 204:
            print(f"Successfully wrote data: {data}")
        else:
            print(f"Failed to write data. Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        print(f"Error writing to InfluxDB: {str(e)}")

def main():
    print("Starting data generation...")
    try:
        while True:
            data = generate_heart_rate()
            write_to_influxdb(data)
            time.sleep(1)  # Generate data every second
    except KeyboardInterrupt:
        print("\nStopping data generation...")

if __name__ == "__main__":
    main() 