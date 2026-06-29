###############################################################################
# Monitoring Module — Variables
###############################################################################

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "firehose_stream_name" {
  description = "Kinesis Firehose delivery stream name"
  type        = string
}

variable "telemetry_lambda_name" {
  description = "Name of the telemetry ingest Lambda function"
  type        = string
  default     = "telemetry-ingest"
}

variable "athena_lambda_name" {
  description = "Name of the Athena query Lambda function"
  type        = string
  default     = "athena-query"
}

variable "alarm_email" {
  description = "Email address for SNS alarm notifications (leave empty to skip subscription)"
  type        = string
  default     = ""
}
