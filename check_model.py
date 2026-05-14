import joblib

# Load the feature names we just saved
features = joblib.load('feature_names.joblib')

print("The model expects these columns (in order):")
for i, col in enumerate(features):
    print(f"{i}: {col}")