import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output'

# Ensure folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

CORS(app)

# File upload route
@app.route('/predict', methods=['POST'])
def predict():
    print("Request.files:", request.files)
    print("Request.form:", request.form)

    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        print(f"File saved to {filepath}")

        df = pd.read_csv(filepath)
        result = {"rows": len(df), "columns": list(df.columns)}
        return jsonify({"result": result})

    except Exception as e:
        print("Error processing file:", e)
        return jsonify({"error": str(e)}), 500

# Compute attention states (dummy logic based on Fp1 mean)
def compute_attention_states(df, window_size=500, threshold=50):
    attention_states = []

    for i in range(0, len(df), window_size):
        window = df.iloc[i:i + window_size]
        mean_fp1 = window['Fp1'].mean()
        attention_states.append(1 if mean_fp1 > threshold else 0)

    return attention_states

# Process EEG and return inattentive periods >10 seconds
@app.route('/process', methods=['POST'])
def process_eeg():
    data = request.get_json()
    filename = data.get('filename')

    if not filename:
        return jsonify({'error': 'Filename not provided'}), 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404

    try:
        df = pd.read_csv(filepath)
        attention_states = compute_attention_states(df)

        # Time axis and duration per window
        stride = 500  # window size (same as above)
        time_per_window = stride / 250
        time_axis = np.arange(len(attention_states)) * time_per_window

        # Detect inattentive periods longer than 10 sec
        inattentive_durations = []
        start_time = None
        duration = 0

        for i, state in enumerate(attention_states):
            if state == 0:
                if start_time is None:
                    start_time = time_axis[i]
                duration += time_per_window
            else:
                if duration >= 10:
                    inattentive_durations.append((start_time, start_time + duration))
                start_time = None
                duration = 0

        # Handle end of array
        if duration >= 10:
            inattentive_durations.append((start_time, start_time + duration))

        periods = [
            f"⏳ From {start:.2f} sec to {end:.2f} sec"
            for start, end in inattentive_durations
        ]

        return jsonify({
            "inattentive_periods": periods,
            "total_periods": len(periods)
        })

    except Exception as e:
        print("Processing error:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8085, debug=True)
