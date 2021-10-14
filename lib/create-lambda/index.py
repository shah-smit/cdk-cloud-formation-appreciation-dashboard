import json
import boto3
import os
from botocore.exceptions import ClientError

SENDER = "Smit Shah <smitshah95@gmail.com>"

# Replace recipient@example.com with a "To" address. If your account 
# is still in the sandbox, this address must be verified.
RECIPIENT = "raja95shah@gmail.com"

# Specify a configuration set. If you do not want to use a configuration
# set, comment the following variable, and the 
# ConfigurationSetName=CONFIGURATION_SET argument below.
# CONFIGURATION_SET = "ConfigSet"

# If necessary, replace us-west-2 with the AWS Region you're using for Amazon SES.
AWS_REGION = "ap-southeast-1"

# The subject line for the email.
SUBJECT = "Thank you!"
            
           

# The character encoding for the email.
CHARSET = "UTF-8"

# Create a new SES resource and specify a region.
client = boto3.client('ses',region_name=AWS_REGION)

def lambda_handler(event, context):

    message = event['message']
    toEmailAddresses = event['to']
    fromEmailAddresses = event['from']
    nickname = event['nickName']
    senderName = event['senderName']

    dynamodb = boto3.resource('dynamodb')
    messages_table = os.environ['TABLE']
    table = dynamodb.Table(messages_table)
    print(event)
    table.put_item(
       Item={
            'messsage': message,
            'message': message
        }
    )

    try:
    #Provide the contents of the email.
        response = client.send_email(
            Destination={
                'ToAddresses': [
                    toEmailAddresses
                ],
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': CHARSET,
                        'Data': build_message(nickname, message, senderName),
                    }
                },
                'Subject': {
                    'Charset': CHARSET,
                    'Data': SUBJECT,
                },
            },
            Source=SENDER,
            # If you are not using a configuration set, comment or delete the
            # following line
            # ConfigurationSetName=CONFIGURATION_SET,
        )
    # Display an error if something goes wrong.	
    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        print("Email sent! Message ID:"),
        print(response['MessageId'])
    
    return { 
        'message': 'successfully inserted' 
    }


def build_message(nickname, str, sender):
    # The HTML body of the email.
    return """<html>
    <head></head>
    <body>
    <p>Hi """+nickname+""",</p>
    <p>"""+str+"""</p>
    <p>Thank you </br>"""+sender+"""
    </body>
    </html>
                """     
