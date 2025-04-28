from kafka import KafkaConsumer
import json

# Create Kafka consumer
consumer = KafkaConsumer('health-data',
                         group_id='health-consumers',
                         bootstrap_servers='kafka:9092',
                         value_deserializer=lambda m: json.loads(m.decode('utf-8')))

# Consume messages from the Kafka topic 'health-data'
for message in consumer:
    data = message.value
    print(f"Consumed data: {data}")