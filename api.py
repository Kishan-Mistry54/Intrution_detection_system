import os
import uuid  # Used to generate unique session IDs
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import numpy as np

app = Flask(__name__)
# CORS allows your website (localhost:8080) to talk to this python server (localhost:5000)
CORS(app, resources={r"/*": {"origins": "http://localhost:8080"}}) 

# Load your trained model artifacts
print("Loading model artifacts...")
model = joblib.load('../frontend/ids_model.joblib')
scaler = joblib.load('../frontend/scaler.joblib')
label_encoder = joblib.load('../frontend/label_encoder.joblib')
feature_names = joblib.load('../frontend/feature_names.joblib')
print("Model loaded successfully!")

# GENERATE A UNIQUE ID FOR THIS SESSION
# This ID changes every time you restart the Python server
SESSION_ID = str(uuid.uuid4())

# NEW ROUTE: Return the session ID to the frontend
@app.route('/get_session_id', methods=['GET'])
def get_session_id():
    return jsonify({'session_id': SESSION_ID})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        print("Received request...")
        # 1. Get the file from the website
        file = request.files['file']
        df = pd.read_csv(file)
        print(f"Data received with shape: {df.shape}")

        # 2. Preprocess
        # Drop target if exists
        possible_targets = ['label', 'class', 'outcome', 'xAttack', 'attack_type']
        for col in possible_targets:
            if col in df.columns:
                df = df.drop(col, axis=1)
        
        # Handle categorical columns
        cat_cols = ['protocol_type', 'service', 'flag']
        for col in cat_cols:
            if col in df.columns:
                # Convert text to numbers
                df[col] = df[col].astype('category').cat.codes
            
        # Ensure column order matches training
        missing_cols = set(feature_names) - set(df.columns)
        for c in missing_cols:
            df[c] = 0 # Fill missing columns with 0
        
        # Reorder columns to match model expectations
        df = df[feature_names]

        # Scale
        data_scaled = scaler.transform(df)

        # 3. Predict
        prediction = model.predict(data_scaled)
        labels = label_encoder.inverse_transform(prediction)
        print(f"Predictions: {labels[:5]}...") # Show first 5 results

        # 4. Return JSON result
        return jsonify({
            'status': 'success',
            'predictions': labels.tolist()
        })

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/live_predict', methods=['GET'])
def live_predict():
    LIVE_FILE = 'live_traffic_buffer.csv'
    
    if not os.path.exists(LIVE_FILE):
        return jsonify({'status': 'empty', 'predictions': []})
        
    try:
        df = pd.read_csv(LIVE_FILE)
        
        if df.empty:
            return jsonify({'status': 'empty', 'predictions': []})

        # Preprocessing
        if 'timestamp' in df.columns: df = df.drop('timestamp', axis=1)
            
        cat_cols = df.select_dtypes(include=['object']).columns
        for col in cat_cols:
            df[col] = df[col].astype('category').cat.codes
        
        # Align columns
        missing_cols = set(feature_names) - set(df.columns)
        for c in missing_cols: df[c] = 0
        df = df[feature_names]

        # Predict
        data_scaled = scaler.transform(df)
        prediction = model.predict(data_scaled)
        labels = label_encoder.inverse_transform(prediction)
        
        return jsonify({
            'status': 'success',
            'predictions': labels.tolist(),
            'count': len(labels)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    # Note: debug=True makes the server auto-reload if you change code
    app.run(debug=True, port=5000)
