import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# -------------------------------
# LOAD DATA
# -------------------------------
df1 = pd.read_csv("data/developer_survey_large.csv")
df2 = pd.read_csv("data/covid_detailed_2019_2021.csv")
df3 = pd.read_csv("data/ai_ml_era_2022_2025.csv")

df = pd.concat([df1, df2, df3], ignore_index=True)

print("Columns:", df.columns)
print("\nData Types:\n", df.dtypes)

# -------------------------------
# CLEAN DATA
# -------------------------------
required_cols = [
    "Developer_Type",
    "Country",
    "Company",
    "Experience_Level",
    "Avg_Salary_USD"
]

df = df.dropna(subset=required_cols)

# -------------------------------
# FIX AUTOMATION RISK (CRITICAL)
# -------------------------------
df["Automation_Risk"] = df["Automation_Risk"].astype(str).str.strip().str.lower()

risk_map = {
    "low": 10,
    "medium": 50,
    "high": 80
}

df["Automation_Risk"] = df["Automation_Risk"].map(risk_map)
df["Automation_Risk"] = pd.to_numeric(df["Automation_Risk"], errors="coerce")
df["Automation_Risk"] = df["Automation_Risk"].fillna(df["Automation_Risk"].median())

# -------------------------------
# FIX YEAR
# -------------------------------
df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
df["Year"] = df["Year"].fillna(df["Year"].median())

# -------------------------------
# FIX AI IMPACT
# -------------------------------
df["AI_Impact_Level"] = df["AI_Impact_Level"].astype(str).str.strip()

# -------------------------------
# ENCODE CATEGORICAL
# -------------------------------
categorical_cols = [
    "Developer_Type",
    "Country",
    "Company",
    "Experience_Level",
    "Remote_Work",
    "AI_Impact_Level"
]

encoders = {}

for col in categorical_cols:
    df[col] = df[col].astype(str).str.strip().fillna("Unknown")

    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    encoders[col] = le

# -------------------------------
# FINAL CLEAN
# -------------------------------
df = df.dropna()

print("Rows after final cleaning:", len(df))

# -------------------------------
# FEATURES
# -------------------------------
X = df[
    [
        "Year",
        "Developer_Type",
        "Country",
        "Company",
        "Experience_Level",
        "Remote_Work",
        "AI_Impact_Level",
        "Automation_Risk"
    ]
]

y = df["Avg_Salary_USD"]

# -------------------------------
# TRAIN MODEL
# -------------------------------
model = RandomForestRegressor(
    n_estimators=150,
    max_depth=12,
    random_state=42
)

model.fit(X, y)

# -------------------------------
# SAVE
# -------------------------------
os.makedirs("saved_model", exist_ok=True)

joblib.dump(model, "saved_model/salary_model.pkl")
joblib.dump(encoders, "saved_model/encoders.pkl")

print("✅ Model trained & saved successfully")