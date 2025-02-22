# import pandas as pd
# import numpy as np
# from http.server import BaseHTTPRequestHandler
# import json
# from supabase_py import create_client, Client
# import os

# class handler(BaseHTTPRequestHandler):
#     def do_POST(self):
#         content_length = int(self.headers['Content-Length'])
#         post_data = self.rfile.read(content_length)
#         data = json.loads(post_data.decode('utf-8'))
        
#         csv_upload_id = data.get('csvUploadId')
#         if not csv_upload_id:
#             self.send_error(400, 'Missing csvUploadId')
#             return

#         try:
#             # Initialize Supabase client
#             supabase: Client = create_client(
#                 os.environ.get('NEXT_PUBLIC_SUPABASE_URL'),
#                 os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
#             )

#             # Get CSV upload record
#             response = supabase.table('csv_uploads').select('*').eq('id', csv_upload_id).single().execute()
#             csv_record = response.data

#             if not csv_record:
#                 self.send_error(404, 'CSV record not found')
#                 return

#             # Download the CSV file
#             original_file = supabase.storage.from_('csv-default-uploads').download(csv_record['csvPath'])
            
#             # Read the CSV into pandas
#             df = pd.read_csv(original_file)

#             # Process the data
#             if 'charge_outcome_risk_score' in df.columns:
#                 df['risk_score'] = df['charge_outcome_risk_score']
#                 df = df.drop('charge_outcome_risk_score', axis=1)

#             df_captured = df[df['charge_captured'] == True]

#             # Filter old data
#             PAST_DAYS = 180
#             minus_days = pd.Timestamp.now() - pd.Timedelta(days=PAST_DAYS)
#             df_captured = df_captured[df_captured['created'] > str(minus_days)]

#             # Split features and labels
#             df_features = df_captured[[col for col in df.columns if (not is_unimportant_col(col)) and (not is_label_col(col))]]
#             df_labels = df_captured[[col for col in df.columns if is_label_col(col)]]

#             df_features = process_dataframe(df_features)
#             df_labels = process_dataframe(df_labels)

#             # Save processed data
#             cleaned_filename = f"cleaned_{csv_record['csvPath'].split('/')[-1]}"
#             cleaned_path = f"{csv_record['userId']}/cleaned/{cleaned_filename}"
            
#             # Save to temporary file
#             df_features.to_csv('/tmp/features.csv', index=False)
            
#             # Upload to Supabase
#             with open('/tmp/features.csv', 'rb') as f:
#                 supabase.storage.from_('csv-cleaned-uploads').upload(
#                     cleaned_path,
#                     f,
#                     {'content-type': 'text/csv'}
#                 )

#             # Update CSV record
#             supabase.table('csv_uploads').update({
#                 'cleanedCsvPath': cleaned_path,
#                 'status': 'PROCESSED'
#             }).eq('id', csv_upload_id).execute()

#             # Send success response
#             self.send_response(200)
#             self.send_header('Content-type', 'application/json')
#             self.end_headers()
#             self.wfile.write(json.dumps({
#                 'success': True,
#                 'message': 'Data processed successfully',
#                 'cleanedPath': cleaned_path
#             }).encode('utf-8'))

#         except Exception as e:
#             print(f"Error processing CSV: {str(e)}")
#             self.send_error(500, f'Error processing CSV: {str(e)}') 
            
# def is_unimportant_col(col):
#     # remove non-usd transaction amounts (they're all corresponding to USD amount anyways)
#     if col.startswith('amount_in_') and col != 'amount_in_usd':
#         return True

#     # not useful for ML classification
#     if col in ['billing_address_postal_code', 'card_bin', 'created']:
#         return True

#     return False

# def is_label_col(col):
#     if col.startswith('risk_level'):
#         return True
#     if col in ['charge_captured', 'charge_status', 'dispute_count', 'dispute_reason', 'efw_count']:
#         return True
#     return False

# def process_dataframe(df):
#     df_final = df.copy()

#     # one-hot encode enumerated columns
#     for column in df_final.columns:
#         if df_final[column].dtype == 'object':
#             if df_final[column].nunique() < 10:
#                 one_hot = pd.get_dummies(df_final[column], prefix=column, dtype='float64', prefix_sep="__")
#                 df_final = pd.concat([df_final, one_hot], axis=1)
#                 df_final.drop(column, axis=1, inplace=True)
#             else:
#                 df_final.drop(column, axis=1, inplace=True)

#     # convert all columns to numeric, coercing errors to NaN
#     for col in df_final.columns:
#         df_final[col] = pd.to_numeric(df_final[col], errors='coerce')

#     # remove non-numeric and NaN columns
#     df_final = df_final.select_dtypes(include=[np.number])
#     df_final.dropna(axis=1, how='all', inplace=True)

#     # remaining NaN columns are assumed to be 0 (e.g. if a count doesn't exist, it's 0)
#     df_final.fillna(0, inplace=True)

#     return df_final


from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type','text/plain')
        self.end_headers()
        self.wfile.write('Hello, world!'.encode('utf-8'))
        return
