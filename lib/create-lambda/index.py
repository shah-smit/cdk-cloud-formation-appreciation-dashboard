import json
import boto3
import os

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    messages_table = os.environ['TABLE']
    table = dynamodb.Table(messages_table)
    print(event)
    table.put_item(
       Item={
            'messsage':event['message']
        }
    )
    
    return { 
        'message': 'successfully inserted' 
    }
