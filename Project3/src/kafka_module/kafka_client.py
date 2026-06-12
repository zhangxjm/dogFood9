import os
import json
import time
from datetime import datetime
from kafka import KafkaProducer, KafkaConsumer
from kafka.admin import KafkaAdminClient, NewTopic
import threading

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9093")

TOPICS = [
    "sensor_data",
    "decision_commands",
    "irrigation_commands",
    "fertilizer_commands",
    "pest_alerts",
]


class KafkaManager:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.producer = None
        self.consumers = {}
        self.connected = False
        self._connect()
    
    def _connect(self):
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v, default=str).encode('utf-8'),
                retries=3,
                retry_backoff_ms=1000,
            )
            self.connected = True
            print("Kafka producer connected successfully.")
        except Exception as e:
            print(f"Kafka connection failed: {e}")
            self.connected = False
    
    def ensure_topics(self):
        try:
            admin_client = KafkaAdminClient(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                client_id='agri-admin'
            )
            
            existing_topics = admin_client.list_topics()
            new_topics = [
                NewTopic(name=topic, num_partitions=1, replication_factor=1)
                for topic in TOPICS if topic not in existing_topics
            ]
            
            if new_topics:
                admin_client.create_topics(new_topics=new_topics)
                print(f"Created topics: {[t.name for t in new_topics]}")
            
            admin_client.close()
            return True
        except Exception as e:
            print(f"Failed to create topics: {e}")
            return False
    
    def send_message(self, topic, message):
        if not self.connected:
            self._connect()
        
        if not self.connected:
            print(f"Kafka not connected. Message to {topic} dropped.")
            return False
        
        try:
            if "timestamp" not in message:
                message["timestamp"] = datetime.now().isoformat()
            
            future = self.producer.send(topic, value=message)
            future.add_callback(self._on_send_success)
            future.add_errback(self._on_send_error)
            self.producer.flush()
            return True
        except Exception as e:
            print(f"Failed to send message to {topic}: {e}")
            return False
    
    def _on_send_success(self, record_metadata):
        pass
    
    def _on_send_error(self, exception):
        print(f"Kafka send error: {exception}")
    
    def get_consumer(self, topic, group_id=None):
        if group_id is None:
            group_id = f"{topic}-group"
        
        if topic in self.consumers:
            return self.consumers[topic]
        
        try:
            consumer = KafkaConsumer(
                topic,
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                group_id=group_id,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='latest',
                enable_auto_commit=True,
            )
            self.consumers[topic] = consumer
            return consumer
        except Exception as e:
            print(f"Failed to create consumer for {topic}: {e}")
            return None
    
    def consume_messages(self, topic, callback, group_id=None):
        consumer = self.get_consumer(topic, group_id)
        if consumer is None:
            return
        
        def run_consumer():
            try:
                for message in consumer:
                    try:
                        callback(message.value)
                    except Exception as e:
                        print(f"Error processing message: {e}")
            except Exception as e:
                print(f"Consumer error for {topic}: {e}")
        
        thread = threading.Thread(target=run_consumer, daemon=True)
        thread.start()
        return thread
    
    def close(self):
        if self.producer:
            self.producer.close()
        for consumer in self.consumers.values():
            consumer.close()
        self.connected = False


class SensorDataProducer:
    def __init__(self):
        self.kafka = KafkaManager()
    
    def send_soil_data(self, field_id, data):
        message = {
            "type": "soil",
            "field_id": field_id,
            "data": data,
        }
        return self.kafka.send_message("sensor_data", message)
    
    def send_weather_data(self, field_id, data):
        message = {
            "type": "weather",
            "field_id": field_id,
            "data": data,
        }
        return self.kafka.send_message("sensor_data", message)
    
    def send_growth_data(self, field_id, data):
        message = {
            "type": "growth",
            "field_id": field_id,
            "data": data,
        }
        return self.kafka.send_message("sensor_data", message)


class DecisionCommandProducer:
    def __init__(self):
        self.kafka = KafkaManager()
    
    def send_irrigation_command(self, field_id, amount, method="滴灌"):
        message = {
            "field_id": field_id,
            "amount": amount,
            "method": method,
            "priority": 1,
            "status": "待执行",
        }
        return self.kafka.send_message("irrigation_commands", message)
    
    def send_fertilizer_command(self, field_id, n, p, k, fertilizer_type="复合肥"):
        message = {
            "field_id": field_id,
            "nitrogen": n,
            "phosphorus": p,
            "potassium": k,
            "fertilizer_type": fertilizer_type,
            "priority": 1,
            "status": "待执行",
        }
        return self.kafka.send_message("fertilizer_commands", message)
    
    def send_pest_alert(self, field_id, pest_type, severity, risk_level):
        message = {
            "field_id": field_id,
            "pest_type": pest_type,
            "severity": severity,
            "risk_level": risk_level,
            "timestamp": datetime.now().isoformat(),
        }
        return self.kafka.send_message("pest_alerts", message)
    
    def send_general_command(self, command_type, field_id, content, priority=1):
        message = {
            "type": command_type,
            "field_id": field_id,
            "content": content,
            "priority": priority,
            "status": "待执行",
        }
        return self.kafka.send_message("decision_commands", message)


def get_kafka_manager():
    return KafkaManager()
