from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

def handle_emergency(message, user_location, hospital_location):
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')  # Fixed typo in STD->SID
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    client = Client(account_sid, auth_token)

    # Hospital numbers (send to each separately)
    hospital_numbers = ['+917700986555', '+918272012511', '+918209076699']
    for number in hospital_numbers:
        send_sms(
            client,
            number,
            f"{message}\nUser Location: https://maps.google.com/?q={user_location['lat']},{user_location['lng']}"
            f"\nHospital Location: https://maps.google.com/?q={hospital_location['lat']},{hospital_location['lng']}"
        )

    # Emergency contacts
    emergency_contacts = ['+919910948788']  # Add your numbers
    for number in emergency_contacts:
        send_sms(client, number, message)

def send_sms(client, to_number, body):
    message = client.messages.create(
        body=body,
        from_=os.getenv('TWILIO_PHONE_NUMBER'),
        to=to_number
    )
    return message.sid