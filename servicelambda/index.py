import logging
import boto3
from botocore.exceptions import ClientError
import os

dynamodb = boto3.resource('dynamodb')
s3 = boto3.resource('s3')


def handler(event, context):

    action = event['action']
    image = event['key']

    imageRequest = {
        "key": image
    }

    if action == 'getLabels':
        getResults = getLabelsFunction(imageRequest)
        if 'image' in getResults:
            return getResults
        else: 
            return 'No Results'

    if action == 'deleteImage':
        delResults = deleteImage(imageRequest)
        return delResults
    else:
        raise Exception("Action Not Detected or recognised")


def getLabelsFunction(imageRequest):

    key = imageRequest['key']

    imageLabelsTable = os.environ['TABLE']
    table = dynamodb.Table(imageLabelsTable)


    try:
        response = table.get_item(key={'image': key})
        item = response['Item']
        return item
    except ClientError as e:
        logging.error(e)
        return "No labels or error"


def deleteImage(imageRequest):

    key = imageRequest['key']

    imageLabelsTable = os.environ['TABLE']
    table = dynamodb.Table(imageLabelsTable)


    try:
        response = table.delete_item(key={'image': key})
    except ClientError as e:
        logging.error(e)

    bucketName = os.environ['BUCKET']
    resizedBucketName = os.environ["RESIZEDBUCKET"]

    try:
        s3.Object(bucketName, key).delete()
        s3.Object(resizedBucketName, key).delete()
    except ClientError as e:
        logging.error(e)

    return "Delete request successfully processed"

    