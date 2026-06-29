output "bucket_arn" {
  description = "ARN of the telemetry S3 bucket"
  value       = aws_s3_bucket.telemetry.arn
}

output "bucket_name" {
  description = "Name of the telemetry S3 bucket"
  value       = aws_s3_bucket.telemetry.bucket
}

output "firehose_arn" {
  description = "ARN of the Kinesis Firehose delivery stream"
  value       = aws_kinesis_firehose_delivery_stream.telemetry_stream.arn
}

output "athena_database_name" {
  description = "Glue catalog database name"
  value       = aws_glue_catalog_database.telemetry_db.name
}

output "ingest_lambda_arn" {
  description = "Placeholder — actual Lambda ARN comes from Amplify"
  value       = ""
}
