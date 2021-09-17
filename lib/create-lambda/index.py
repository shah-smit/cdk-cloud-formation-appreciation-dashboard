import json
import boto3
import os

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    messages_table = os.environ['TABLE']
    table = dynamodb.Table(messages_table)
    print(event)
    response = table.put_item(
       Item={
            'messsage':event['message']
        }
    )
    return response
    
    return {
        'statusCode': 200,
        'body': json.dumps(data)
    }
