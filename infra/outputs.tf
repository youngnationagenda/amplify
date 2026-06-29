output "api_gateway_url" {
  description = "Base URL for the unified API Gateway"
  value       = module.api_gateway.api_url
}

output "telemetry_bucket_arn" {
  description = "ARN of the telemetry S3 bucket"
  value       = module.telemetry_pipeline.bucket_arn
}

output "firehose_stream_arn" {
  description = "ARN of the Kinesis Firehose delivery stream"
  value       = module.telemetry_pipeline.firehose_arn
}

output "athena_database_name" {
  description = "Glue/Athena database name"
  value       = module.telemetry_pipeline.athena_database_name
}
