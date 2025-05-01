import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from scipy.signal import butter, filtfilt

# Load the trained Keras model
model = load_model("attention_model.h5")

# EEG channels used (after dropping pkt_num and timestamp)
EEG_CHANNELS = ['Fp1', 'Fp2', 'F3', 'F4', 'T4', 'O2', 'T3', 'O1']

def bandpass_filter(data, lowcut=1, highcut=50, fs=250, order=4):
    nyquist = 0.5 * fs
    low = lowcut / nyquist
    high = highcut / nyquist
    b, a = butter(order, [low, high], btype="band")
    return filtfilt(b, a, data, axis=0)

def process_eeg_file(filepath):
    df = pd.read_csv(filepath)

    # Drop unused columns
    df = df.drop(columns=['pkt_num', 'timestamp'], errors='ignore')

    # Ensure all required channels are present
    if not all(ch in df.columns for ch in EEG_CHANNELS):
        raise ValueError("Missing required EEG channels")

    df = df[EEG_CHANNELS]

    # Apply bandpass filter
    filtered = bandpass_filter(df.values)

    # Segment into non-overlapping windows (500 samples = 2s, stride = 500 = 2s)
    window_size = 500
    stride = 500
    segments = []

    for start in range(0, len(filtered) - window_size + 1, stride):
        segment = filtered[start:start + window_size]
        segments.append(segment)

    X_segmented = np.array(segments)  # shape: (num_windows, 500, 8)

    # Global normalization (like Colab)
    mean = np.mean(X_segmented, axis=(0, 1))
    std = np.std(X_segmented, axis=(0, 1))
    X_normalized = (X_segmented - mean) / std

    # Predict attention
    predictions = model.predict(X_normalized)
    attention_states = (predictions >= 0.8).astype(int).flatten()

    # Time axis in seconds (each window = 2s)
    stride_sec = stride / 250  # = 2.0
    time_axis = np.arange(len(attention_states)) * stride_sec

    # Detect inattentive periods ≥10s (5 consecutive windows of inattention)
    inattentive_durations = []
    start = None
    duration = 0

    for i, state in enumerate(attention_states):
        if state == 0:
            if start is None:
                start = time_axis[i]
            duration += stride_sec
        else:
            if duration >= 5:
                inattentive_durations.append((start, start + duration))
            start = None
            duration = 0

    # ✅ Ensure final period is included if data ends with inattention
    if start is not None and duration >= 5:
        inattentive_durations.append((start, start + duration))

    # Format for frontend
    output = [f"⏳ From {s:.2f} sec to {e:.2f} sec" for s, e in inattentive_durations]

    return {
        "inattentive_periods": output,
        "total_periods": len(output)
    }
