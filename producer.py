import os
import time
import json
import random
from datetime import datetime
from kafka import KafkaProducer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_producer():
    retries = 5
    while retries > 0:
        try:
            producer = KafkaProducer(
                bootstrap_servers=['localhost:9092'],
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                api_version=(0, 10, 1)
            )
            print("Successfully connected to Kafka")
            return producer
        except Exception as e:
            print(f"Failed to connect to Kafka, retrying... Error: {str(e)}")
            retries -= 1
            time.sleep(5)
    raise Exception("Failed to connect to Kafka after multiple retries")

# Start a counter for unique patient IDs
patient_counter = 1

patient_names = [
    ("Ava Smith", "F"), ("Liam Johnson", "M"), ("Olivia Williams", "F"), ("Noah Brown", "M"), ("Emma Jones", "F"),
    ("Elijah Garcia", "M"), ("Sophia Miller", "F"), ("Mason Davis", "M"), ("Isabella Martinez", "F"), ("Lucas Wilson", "M"),
    ("Mia Anderson", "F"), ("Benjamin Thomas", "M"), ("Charlotte Lee", "F"), ("James Harris", "M"), ("Amelia Clark", "F"),
    ("Henry Lewis", "M"), ("Harper Young", "F"), ("Alexander Walker", "M"), ("Evelyn Hall", "F"), ("Sebastian Allen", "M"),
    ("Abigail King", "F"), ("Jack Wright", "M"), ("Emily Scott", "F"), ("Daniel Green", "M"), ("Elizabeth Adams", "F"),
    ("Matthew Baker", "M"), ("Ella Nelson", "F"), ("Jackson Carter", "M"), ("Scarlett Mitchell", "F"), ("Aiden Perez", "M"),
    ("Grace Roberts", "F"), ("Samuel Turner", "M"), ("Chloe Phillips", "F"), ("David Campbell", "M"), ("Penelope Parker", "F"),
    ("Joseph Evans", "M"), ("Layla Edwards", "F"), ("Owen Collins", "M"), ("Victoria Stewart", "F"), ("Wyatt Sanchez", "M"),
    ("Lily Morris", "F"), ("John Rogers", "M"), ("Zoey Reed", "F"), ("Julian Cook", "M"), ("Hannah Morgan", "F"),
    ("Levi Bell", "M"), ("Nora Murphy", "F"), ("Gabriel Bailey", "M"), ("Aria Rivera", "F"), ("Carter Cooper", "M")
]

def generate_patient_data():
    global patient_counter
    name, gender = patient_names[(patient_counter - 1) % len(patient_names)]
    patient_id = f"P{patient_counter:04d}"
    patient_counter += 1

    age = random.randint(18, 90)
    timestamp = datetime.now().isoformat()
    heart_rate = random.randint(60, 120)
    spo2 = random.randint(95, 100)
    systolic = random.randint(100, 140)
    diastolic = random.randint(60, 90)
    blood_pressure = f"{systolic}/{diastolic}"
    temperature = round(random.uniform(36, 37.5), 1)

    return {
        "patient_id": patient_id,
        "name": name,
        "gender": gender,
        "age": age,
        "timestamp": timestamp,
        "heart_rate": heart_rate,
        "spo2": spo2,
        "blood_pressure": blood_pressure,
        "temperature": temperature
    }

def main():
    # Initialize Kafka producer with retries
    producer = create_producer()
    
    print("Starting producer. Sending data to health-data topic...")
    
    try:
        while True:
            # Generate heart rate data
            data = generate_patient_data()
            
            # Send data to Kafka
            producer.send('health-data', value=data)
            print(f"Sent data: {data}")
            
            # Wait for 1 second before sending next data
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("Stopping producer...")
    finally:
        producer.close()

if __name__ == "__main__":
    main() 