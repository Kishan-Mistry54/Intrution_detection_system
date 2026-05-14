import csv
import time
import os
import random
from datetime import datetime

# This is the file the Backend reads
LIVE_TRAFFIC_FILE = 'live_traffic_buffer.csv'

# Use the headers your model expects (simplified for live traffic)
# We will fill the complex columns with 0
fieldnames = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes', 
    'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 
    'logged_in', 'num_compromised', 'root_shell', 'su_attempted', 
    'num_root', 'num_file_creations', 'num_shells', 'num_access_files', 
    'num_outbound_cmds', 'is_host_login', 'is_guest_login', 'count', 
    'srv_count', 'serror_rate', 'srv_serror_rate', 'rerror_rate', 
    'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate', 
    'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count', 
    'dst_host_same_srv_rate', 'dst_host_diff_srv_rate', 
    'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate', 
    'dst_host_serror_rate', 'dst_host_srv_serror_rate', 
    'dst_host_rerror_rate', 'dst_host_srv_rerror_rate'
]

def init_csv():
    # Clear file on start
    with open(LIVE_TRAFFIC_FILE, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

def generate_row():
    # Simulate mixed traffic (Mostly Normal, some Attacks)
    is_attack = random.random() < 0.2 # 20% chance of attack

    if is_attack:
        # Attack-like features
        return {
            'duration': 0, 
            'protocol_type': 'tcp', 
            'service': 'private', 
            'flag': 'S0', 
            'src_bytes': 0, 
            'dst_bytes': 0,
            # Fill rest with 0
            **{col: 0 for col in fieldnames if col not in ['duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes']}
        }
    else:
        # Normal HTTP traffic
        return {
            'duration': 0, 
            'protocol_type': 'tcp', 
            'service': 'http', 
            'flag': 'SF', 
            'src_bytes': random.randint(100, 5000), 
            'dst_bytes': random.randint(100, 5000),
            # Fill rest with 0
            **{col: 0 for col in fieldnames if col not in ['duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes']}
        }

if __name__ == "__main__":
    print("Initializing Live Traffic Generator...")
    init_csv()
    print("Generating live traffic... Press Ctrl+C to stop.")
    
    try:
        while True:
            row = generate_row()
            
            # Append to CSV
            with open(LIVE_TRAFFIC_FILE, 'a', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writerow(row)
            
            print(f"Generated: {row['service']} ({row['flag']})")
            time.sleep(1) # Add 1 packet per second
            
    except KeyboardInterrupt:
        print("\nStopped.")