# model.py

import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from scipy.signal import butter, filtfilt

# Load model
model = load_model("attention_model.h5")

# Channels used in Colab
EEG_CHANNELS = ['Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2']

def bandpass_filter(data, lowcut=1, highcut=50, fs=250, order=4):
    nyquist = 0.5 * fs
    low = lowcut / nyquist
    high = highcut / nyquist
    b, a = butter(order, [low, high], btype="band")
    return filtfilt(b, a, data, axis=0)

def process_eeg_file(filepath):
    df = pd.read_csv(filepath)

    # Only keep EEG channels (match Colab)
    df = df[[col for col in EEG_CHANNELS if col in df.columns]]

    filtered = bandpass_filter(df.values)

    # Segmentation: 500 samples window, 250 stride (Colab)
    window_size = 500
    stride = 250
    segments = []

    for start in range(0, len(filtered) - window_size + 1, stride):
        segment = filtered[start:start + window_size]

        # Normalize per segment (Colab style)
        mean = segment.mean(axis=0)
        std = segment.std(axis=0)
        normalized = (segment - mean) / std
        segments.append(normalized)

    if len(segments) == 0:
        raise ValueError("EEG data too short for segmentation")

    X = np.array(segments)

    # Predict
    predictions = model.predict(X)
    attention_states = (predictions >= 0.8).astype(int).flatten()

    # Time axis
    time_axis = np.arange(len(attention_states)) * (stride / 250)

    # Find inattentive periods
    inattentive_periods = []
    start = None

    for t, state in zip(time_axis, attention_states):
        if state == 0:
            if start is None:
                start = t
        else:
            if start is not None:
                inattentive_periods.append([round(start, 2), round(t, 2)])
                start = None

    if start is not None:
        inattentive_periods.append([round(start, 2), round(time_axis[-1], 2)])

    return {"inattentive_durations": inattentive_periods}
