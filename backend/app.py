import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from model import process_eeg_file

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        return jsonify({"result": "File uploaded", "filename": file.filename})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/process', methods=['POST'])
def process():
    data = request.get_json()
    filename = data.get('filename')
    if not filename:
        return jsonify({'error': 'Filename not provided'}), 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404

    try:
        result = process_eeg_file(filepath)
        return jsonify(result)
    except Exception as e:
        print("Processing error:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        # ✅ Guaranteed file removal after processing attempt
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"Deleted uploaded file: {filepath}")
        except Exception as cleanup_err:
            print(f"Error deleting file {filepath}: {cleanup_err}")

@app.route('/plot')
def get_plot():
    return send_file("output/attention_plot.png", mimetype='image/png')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8085, debug=True)
