import json
import time
import random
import os
from kafka import KafkaProducer
from datetime import datetime

# Kafka configuration (use default values or environment variables)
KAFKA_BROKER = os.getenv('KAFKA_BROKER', 'kafka:29092')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'patient-data')
GENERATION_INTERVAL_MS = int(os.getenv('GENERATION_INTERVAL_MS', 5000))
NUM_RECORDS_PER_BATCH = int(os.getenv('NUM_RECORDS_PER_BATCH', 100))

# Patient demographics for structured data generation
PATIENT_DEMOGRAPHICS = [
    {'patient_id': f'P{i:06d}', 
     'age': random.randint(18, 95),
     'gender': random.choice(['M', 'F']),
     'condition': random.choice(['Stable', 'Critical', 'Improving', 'Worsening']),
     'department': random.choice(['Cardiology', 'Neurology', 'Oncology', 'Emergency', 'ICU', 'General']),
     'admission_date': (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d')
    } for i in range(1, 1001)
]

# List of medical devices
DEVICE_TYPES = [
    'ECG_Monitor', 'Ventilator', 'Infusion_Pump', 'Patient_Monitor', 
    'Blood_Pressure_Monitor', 'Glucose_Monitor', 'Pulse_Oximeter'
]

# Initialize Kafka producer
producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BROKER],
    value_serializer=lambda x: json.dumps(x).encode('utf-8')
)

def generate_device_reading(patient):
    """Generate a simulated IoT medical device reading."""
    device_type = random.choice(DEVICE_TYPES)
    timestamp = datetime.now().isoformat()
    device_id = f"{device_type}_{random.randint(1000, 9999)}"
    
    # Generate vital signs based on device type
    readings = {}
    if device_type == 'ECG_Monitor':
        readings['heart_rate'] = random.randint(40, 180)
    elif device_type == 'Ventilator':
        readings['respiratory_rate'] = random.randint(8, 30)
    elif device_type == 'Blood_Pressure_Monitor':
        readings['blood_pressure_systolic'] = random.randint(80, 180)
        readings['blood_pressure_diastolic'] = random.randint(40, 120)
    elif device_type == 'Glucose_Monitor':
        readings['glucose_level'] = random.randint(60, 300)
    elif device_type == 'Pulse_Oximeter':
        readings['oxygen_saturation'] = random.randint(80, 100)
    elif device_type == 'Patient_Monitor':
        readings['heart_rate'] = random.randint(40, 180)
        readings['respiratory_rate'] = random.randint(8, 30)
        readings['temperature'] = round(random.uniform(35.0, 40.0), 1)
    
    # Create the complete device reading
    reading = {
        'patient_id': patient['patient_id'],
        'device_id': device_id,
        'device_type': device_type,
        'timestamp': timestamp,
        'readings': readings,
        'battery_level': random.randint(10, 100),
        'status': random.choice(['Active', 'Standby', 'Warning', 'Error']),
        'department': patient['department']
    }
    
    return reading

def main():
    """Main function to generate and send data to Kafka"""
    print(f"Starting data generation. Sending to Kafka topic: {KAFKA_TOPIC} at {KAFKA_BROKER}")
    
    message_count = 0
    while True:
        batch = []
        for _ in range(NUM_RECORDS_PER_BATCH):
            patient = random.choice(PATIENT_DEMOGRAPHICS)
            device_reading = generate_device_reading(patient)
            batch.append(device_reading)
            
            # Send individual reading to Kafka
            producer.send(KAFKA_TOPIC, value=device_reading)
            message_count += 1
        
        # Flush producer to ensure delivery
        producer.flush()
        
        print(f"Generated {NUM_RECORDS_PER_BATCH} records. Total sent: {message_count}")
        
        # Sleep for the configured interval (in seconds)
        time.sleep(GENERATION_INTERVAL_MS / 1000)

if __name__ == "__main__":
    main()
