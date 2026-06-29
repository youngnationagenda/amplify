variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "telemetry_bucket" {
  description = "Base name for the telemetry S3 bucket"
  type        = string
}

variable "firehose_stream_name" {
  description = "Kinesis Firehose delivery stream name"
  type        = string
}

variable "athena_database" {
  description = "Glue/Athena database name"
  type        = string
}

variable "athena_workgroup" {
  description = "Athena workgroup name"
  type        = string
}

variable "bytes_scanned_cutoff_per_query" {
  description = "Maximum bytes Athena will scan per query (cost control). Default 10 GB."
  type        = number
  default     = 10737418240
}
