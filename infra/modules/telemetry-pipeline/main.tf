###############################################################################
# Telemetry Pipeline Module
#
# Flow: API Gateway → Lambda → Kinesis Firehose → S3 (JSON/Parquet) → Athena
#
# Components:
#   - S3 bucket for raw telemetry storage
#   - Kinesis Firehose delivery stream
#   - Glue database + table for Athena queries
#   - IAM roles and policies (see iam.tf)
###############################################################################

# ─── S3 Bucket for Telemetry Data ─────────────────────────────────────────────

resource "aws_s3_bucket" "telemetry" {
  bucket = "${var.telemetry_bucket}-${var.environment}"

  tags = {
    Component = "evtelemetryai"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "telemetry_lifecycle" {
  bucket = aws_s3_bucket.telemetry.id

  rule {
    id     = "archive-old-data"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555 # 7 years retention
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "telemetry_encryption" {
  bucket = aws_s3_bucket.telemetry.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "telemetry_public_access" {
  bucket = aws_s3_bucket.telemetry.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─── Kinesis Firehose Delivery Stream ─────────────────────────────────────────

resource "aws_kinesis_firehose_delivery_stream" "telemetry_stream" {
  name        = "${var.firehose_stream_name}-${var.environment}"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose_role.arn
    bucket_arn = aws_s3_bucket.telemetry.arn

    prefix              = "telemetry/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"

    buffering_size     = 64  # MB
    buffering_interval = 300 # seconds (5 min)

    compression_format = "GZIP"

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = "/aws/firehose/nettribe-telemetry-${var.environment}"
      log_stream_name = "S3Delivery"
    }
  }

  tags = {
    Component = "evtelemetryai"
  }
}

# ─── Glue Database + Table for Athena ─────────────────────────────────────────

resource "aws_glue_catalog_database" "telemetry_db" {
  name = "${var.athena_database}_${var.environment}"
}

resource "aws_glue_catalog_table" "telemetry_events" {
  name          = "telemetry_events"
  database_name = aws_glue_catalog_database.telemetry_db.name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    "classification"  = "json"
    "compressionType" = "gzip"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.telemetry.bucket}/telemetry/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    ser_de_info {
      serialization_library = "org.openx.data.jsonserde.JsonSerDe"
      parameters = {
        "paths" = "deviceId,riderId,motorcycleId,timestamp,latitude,longitude,speedKmh,batteryLevel,energyConsumedKwh,distanceKm,ambientTempC,motorTempC,eventType"
      }
    }

    columns {
      name = "deviceId"
      type = "string"
    }
    columns {
      name = "riderId"
      type = "string"
    }
    columns {
      name = "motorcycleId"
      type = "string"
    }
    columns {
      name = "timestamp"
      type = "string"
    }
    columns {
      name = "latitude"
      type = "double"
    }
    columns {
      name = "longitude"
      type = "double"
    }
    columns {
      name = "speedKmh"
      type = "double"
    }
    columns {
      name = "batteryLevel"
      type = "double"
    }
    columns {
      name = "energyConsumedKwh"
      type = "double"
    }
    columns {
      name = "distanceKm"
      type = "double"
    }
    columns {
      name = "ambientTempC"
      type = "double"
    }
    columns {
      name = "motorTempC"
      type = "double"
    }
    columns {
      name = "eventType"
      type = "string"
    }
  }

  partition_keys {
    name = "year"
    type = "string"
  }
  partition_keys {
    name = "month"
    type = "string"
  }
  partition_keys {
    name = "day"
    type = "string"
  }
}

# ─── Athena Workgroup ─────────────────────────────────────────────────────────

resource "aws_athena_workgroup" "telemetry" {
  name  = "${var.athena_workgroup}-${var.environment}"
  state = "ENABLED"

  configuration {
    result_configuration {
      output_location = "s3://${aws_s3_bucket.telemetry.bucket}/athena-results/"

      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }

    bytes_scanned_cutoff_per_query = var.bytes_scanned_cutoff_per_query
  }

  tags = {
    Component = "evtelemetryai"
  }
}

# ─── S3 Bucket for Athena Results ─────────────────────────────────────────────

resource "aws_s3_bucket" "athena_results" {
  bucket = "nettribe-athena-results-${var.environment}"

  tags = {
    Component = "evtelemetryai"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "athena_results_lifecycle" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    id     = "expire-query-results"
    status = "Enabled"

    expiration {
      days = 7
    }
  }
}
