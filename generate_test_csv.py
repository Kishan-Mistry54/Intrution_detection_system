import pandas as pd
import joblib
import numpy as np

# 1. Load the model's expected features
feature_names = joblib.load('feature_names.joblib')

# 2. Create a dummy dataframe with these exact columns
data = {}
for col in feature_names:
    # Create random data based on likely types
    if col in ['protocol_type', 'service', 'flag']:
        data[col] = ['tcp', 'udp', 'icmp', 'tcp', 'udp']
    elif col in ['land', 'logged_in', 'root_shell', 'is_host_login', 'is_guest_login']:
        data[col] = [0, 0, 0, 1, 0]
    else:
        # Fill numeric columns with 0
        data[col] = [0, 0, 0, 0, 0]

df = pd.DataFrame(data)

# 3. Save to CSV
df.to_csv('perfect_test.csv', index=False)

print("Success! 'perfect_test.csv' has been created.")
print("It has these columns:", df.columns.tolist())