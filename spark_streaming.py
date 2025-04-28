from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, TimestampType
import requests
import json
from datetime import datetime
import os

# Initialize Spark Session
spark = SparkSession.builder \
    .appName("HealthTrendStreaming") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0") \
    .getOrCreate()

# Define schema for the JSON data
schema = StructType([
    StructField("patient_id", StringType(), True),
    StructField("heart_rate", IntegerType(), True),
    StructField("timestamp", StringType(), True)
])

# Read from Kafka
df = spark \
    .readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "health-data") \
    .option("startingOffsets", "earliest") \
    .load()

# Parse JSON data
parsed_df = df.select(
    from_json(col("value").cast("string"), schema).alias("data")
).select("data.*")

# Function to write to InfluxDB
def write_to_influxdb(batch_df, batch_id):
    # Convert Spark DataFrame to Pandas for easier processing
    pandas_df = batch_df.toPandas()
    
    # InfluxDB connection details
    INFLUXDB_HOST = "influxdb"
    INFLUXDB_PORT = "8086"
    INFLUXDB_DATABASE = "healthtrend"
    INFLUXDB_USER = "admin"
    INFLUXDB_PASSWORD = "adminpassword"
    
    # Prepare the URL
    url = f"http://{INFLUXDB_HOST}:{INFLUXDB_PORT}/write"
    params = {
        "db": INFLUXDB_DATABASE,
        "u": INFLUXDB_USER,
        "p": INFLUXDB_PASSWORD
    }
    
    for _, row in pandas_df.iterrows():
        # Convert timestamp to nanoseconds
        try:
            timestamp = int(datetime.strptime(row["timestamp"], "%Y-%m-%dT%H:%M:%SZ").timestamp() * 1000000000)
        except:
            timestamp = int(datetime.utcnow().timestamp() * 1000000000)
            
        # Format data in line protocol
        line = f'heart_rates,patient_id={row["patient_id"]} value={row["heart_rate"]} {timestamp}'
        
        # Send data to InfluxDB
        try:
            response = requests.post(url, params=params, data=line)
            print(f"Write Response: {response.status_code}, Data: {line}")
            if response.status_code != 204:
                print(f"Error writing to InfluxDB: {response.text}")
        except Exception as e:
            print(f"Exception writing to InfluxDB: {str(e)}")

# Write to InfluxDB
query = parsed_df.writeStream \
    .foreachBatch(write_to_influxdb) \
    .outputMode("append") \
    .start()

# Wait for the streaming to finish
query.awaitTermination()