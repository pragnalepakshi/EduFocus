import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from scipy.signal import butter, filtfilt
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import os
import time

model = load_model("attention_model.h5")
EEG_CHANNELS = ['Fp1', 'Fp2', 'F3', 'F4', 'T4', 'O2', 'T3', 'O1']

def bandpass_filter(data, lowcut=1, highcut=50, fs=250, order=4):
    nyquist = 0.5 * fs
    low = lowcut / nyquist
    high = highcut / nyquist
    b, a = butter(order, [low, high], btype="band")
    return filtfilt(b, a, data, axis=0)

def save_attention_plot(time_axis, attention_states, filename="output/attention_plot.png"):
    plt.figure(figsize=(12, 5))
    plt.plot(time_axis, attention_states, marker='o', linestyle='-', color='b', alpha=0.7)
    plt.xlabel("Time (seconds)")
    plt.ylabel("Attention State (1=Attentive, 0=Inattentive)")
    plt.title("EEG Attention Variation Over Time")
    plt.yticks([0, 1], labels=["Inattentive", "Attentive"])
    plt.grid(True)
    plt.tight_layout()
    os.makedirs("output", exist_ok=True)
    plt.savefig(filename)
    plt.close()

def process_eeg_file(filepath):
    df = pd.read_csv(filepath)
    df = df.drop(columns=['pkt_num', 'timestamp'], errors='ignore')

    if not all(ch in df.columns for ch in EEG_CHANNELS):
        raise ValueError("Missing required EEG channels")

    df = df[EEG_CHANNELS]
    filtered = bandpass_filter(df.values)

    window_size = 500
    stride = 500
    segments = []

    for start in range(0, len(filtered) - window_size + 1, stride):
        segment = filtered[start:start + window_size]
        segments.append(segment)

    X_segmented = np.array(segments)

    mean = np.mean(X_segmented, axis=(0, 1))
    std = np.std(X_segmented, axis=(0, 1))
    X_normalized = (X_segmented - mean) / std

    predictions = model.predict(X_normalized)
    attention_states = (predictions >= 0.8).astype(int).flatten()
    stride_sec = stride / 250
    time_axis = np.arange(len(attention_states)) * stride_sec

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

    if start is not None and duration >= 5:
        inattentive_durations.append((start, start + duration))

    output = [f"⏳ From {s:.2f} sec to {e:.2f} sec" for s, e in inattentive_durations]
    save_attention_plot(time_axis, attention_states)

    # Append timestamp to bust image cache
    timestamp = int(time.time())

    return {
        "inattentive_periods": output,
        "total_periods": len(output),
        "time_axis": time_axis.tolist(),
        "attention_states": attention_states.tolist(),
        "plot_url": f"http://192.168.1.4:8085/plot?t={timestamp}"
    }
