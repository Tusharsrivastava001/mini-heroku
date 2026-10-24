import os
from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "platform": "DeployForge",
        "runtime": "Python 3.11",
        "environment": os.environ.get("FLASK_ENV", "production"),
        "message": "Hello from DeployForge Python Flask service!",
    })

@app.route("/health")
def health():
    return jsonify({"status": "UP"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
