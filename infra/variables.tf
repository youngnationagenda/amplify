variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "telemetry_bucket" {
  description = "S3 bucket for telemetry data (Firehose destination)"
  type        = string
  default     = "nettribe-telemetry-data"
}

variable "firehose_stream_name" {
  description = "Kinesis Firehose delivery stream name"
  type        = string
  default     = "nettribe-telemetry-stream"
}

variable "athena_database" {
  description = "Athena/Glue database name for telemetry queries"
  type        = string
  default     = "nettribe_carbon"
}

variable "athena_workgroup" {
  description = "Athena workgroup name"
  type        = string
  default     = "primary"
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID (created by Amplify Auth)"
  type        = string
  default     = ""
}

variable "athena_lambda_arn" {
  description = "ARN of the Athena query Lambda (created by Amplify)"
  type        = string
  default     = ""
}
