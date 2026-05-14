import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

# 1. LOAD YOUR DATASET
# ==========================================
# Replace 'kaggle_dataset.txt' with your actual filename
filename = 'KDDTrain+.txt'  # Example filename, change as needed

# NSL-KDD specific column names
# This dataset has 43 columns. The last one is usually 'difficulty', second to last is 'label'
column_names = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes', 'land', 
    'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in', 'num_compromised', 
    'root_shell', 'su_attempted', 'num_root', 'num_file_creations', 'num_shells', 
    'num_access_files', 'num_outbound_cmds', 'is_host_login', 'is_guest_login', 'count', 
    'srv_count', 'serror_rate', 'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate', 
    'same_srv_rate', 'diff_srv_rate', 'srv_diff_host_rate', 'dst_host_count', 
    'dst_host_srv_count', 'dst_host_same_srv_rate', 'dst_host_diff_srv_rate', 
    'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate', 'dst_host_serror_rate', 
    'dst_host_srv_serror_rate', 'dst_host_rerror_rate', 'dst_host_srv_rerror_rate', 
    'label', 'difficulty'
]

print(f"Loading dataset: {filename}...")
try:
    # Use 'names' to force the headers because the TXT file doesn't have them
    df = pd.read_csv(filename, names=column_names)
except FileNotFoundError:
    print("Error: File not found. Check the filename.")
    exit()

print(f"Data loaded with shape: {df.shape}")

# Drop rows with missing values
df = df.dropna()

# Drop 'difficulty' column as it is not a useful feature for detection
if 'difficulty' in df.columns:
    df = df.drop('difficulty', axis=1)

# 2. PREPROCESSING
# ==========================================
print("Preprocessing data...")

# Identify Target Column
# NSL-KDD usually has the target in the last column (often column 41 or 42 named 'xAttack' or just 'label')
target_col = None
possible_targets = ['label', 'class', 'outcome', 'xAttack', 'attack_type']

for col in possible_targets:
    if col in df.columns:
        target_col = col
        break

if target_col is None:
    # If specific names not found, assume the LAST column is the target
    print("Target column name not found in standard list. Using the last column as target.")
    target_col = df.columns[-1]

# Separate Features (X) and Target (y)
# Encode Target (Normal=0, Attack=1, etc.)
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(df[target_col])

# Drop target from features
X = df.drop(target_col, axis=1)

# Encode Categorical Features (Protocol_type, Service, Flag, etc.)
cat_cols = X.select_dtypes(include=['object']).columns
print(f"Found categorical columns to encode: {list(cat_cols)}")

for col in cat_cols:
    X[col] = LabelEncoder().fit_transform(X[col])

# Scale Features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Save feature names (column order) for the web app
feature_names = X.columns.tolist()

# Split Data
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.3, random_state=42)

# 3. TRAIN MODEL
# ==========================================
print("Training model (Random Forest)...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 4. EVALUATE
# ==========================================
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\nModel Trained Successfully!")
print(f"Accuracy: {acc:.4f}")
print("\nClassification Report:")
# target_names handles the class labels (0 vs 1 or Normal vs Attack)
print(classification_report(y_test, y_pred, target_names=[str(c) for c in label_encoder.classes_]))

# 5. SAVE ARTIFACTS
# ==========================================
joblib.dump(model, 'ids_model.joblib')
joblib.dump(scaler, 'scaler.joblib')
joblib.dump(label_encoder, 'label_encoder.joblib')
joblib.dump(feature_names, 'feature_names.joblib')

print("\nFiles saved to disk. You are ready to build the web app!")