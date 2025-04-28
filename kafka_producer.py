from kafka import KafkaProducer
import pandas as pd
import json
import time

# Read the CSV file
df = pd.read_csv('health-data.csv')

# Create Kafka producer
producer = KafkaProducer(
    bootstrap_servers='kafka:9092',  # Use container name for Docker networking
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Send each row of the CSV file as a message to the Kafka topic 'health-data'
for _, row in df.iterrows():
    # Convert the row into a dictionary
    data = row.to_dict()
    # Send the data to Kafka
    producer.send('health-data', data)
    print(f"Sent data: {data}")
    time.sleep(0.1)  # Small delay to avoid overwhelming the system

# Ensure all messages are sent before closing
producer.flush()
# Close the producer after sending all the data
producer.close()