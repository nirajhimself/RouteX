import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

# load dataset
data = pd.read_csv("delivery_data.csv")

# features
X = data[["distance", "traffic", "vehicle_type"]]

# label
y = data["delay"]

# model
model = RandomForestClassifier()

# train model
model.fit(X, y)

# save model
joblib.dump(model, "delay_model.pkl")

print("Model trained and saved!")