from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai
import os
from emergency_handler import handle_emergency

load_dotenv()

app = Flask(__name__)
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-pro')

@app.route('/')
def index():
    # Add initial wake-up message
    return render_template('index.html', initial_message="Hello! How can I help you today?")

@app.route('/process', methods=['POST'])
def process():
    user_message = request.json['message']
    
    # Check for emergency keywords
    if is_emergency(user_message):
        return jsonify({
            'response': "Emergency detected! Help is on the way.",
            'emergency': True
        })
    
    # Normal response
    response = generate_response(user_message)
    return jsonify({'response': response, 'emergency': False})

def is_emergency(message):
    # Add more sophisticated checks here
    emergency_keywords = ['heart attack', 'stroke', 'unconscious', 'bleeding']
    return any(keyword in message.lower() for keyword in emergency_keywords)

def generate_response(message):
    prompt = f"""Act as a medical assistant. User says: {message}
    Give brief medical advice. If serious, say 'EMERGENCY' at start."""
    response = model.generate_content(prompt)
    return response.text

@app.route('/send-emergency', methods=['POST'])
def send_emergency():
    data = request.json
    handle_emergency(
        data['message'], 
        data['location'],
        data.get('hospital')  # Add hospital location parameter
    )
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)