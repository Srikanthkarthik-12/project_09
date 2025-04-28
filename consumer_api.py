from flask import Flask, jsonify
from kafka import KafkaConsumer
import json
import threading

app = Flask(__name__)
latest_data = {}

def consume():
    global latest_data
    consumer = KafkaConsumer(
        'health-data',
        bootstrap_servers=['localhost:9092'],
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        auto_offset_reset='latest',
        enable_auto_commit=True,
        group_id='dashboard-group'
    )
    for message in consumer:
        latest_data = message.value

@app.route('/latest')
def get_latest():
    return jsonify(latest_data)

if __name__ == '__main__':
    threading.Thread(target=consume, daemon=True).start()
    app.run(port=5000) 