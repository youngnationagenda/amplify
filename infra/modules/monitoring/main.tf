###############################################################################
# Monitoring Module — CloudWatch Log Groups, Alarms, and SNS Notifications
#
# Creates centralized monitoring for the NetTribe telemetry pipeline:
#   - CloudWatch Log Groups for API Gateway and Lambda functions
#   - SNS Topic for alarm notifications
#   - CloudWatch Alarms for Lambda errors, Firehose freshness, Athena cost
###############################################################################

locals {
  log_prefix = "/nettribe/${var.environment}"

  common_tags = {
    Component = "monitoring"
  }
}

# ─── SNS Topic for Alarm Notifications ────────────────────────────────────────

resource "aws_sns_topic" "alarms" {
  name = "nettribe-alarms-${var.environment}"

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  count = var.alarm_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# ─── CloudWatch Log Groups ────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "${local.log_prefix}/api-gateway"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_telemetry_ingest" {
  name              = "${local.log_prefix}/lambda/${var.telemetry_lambda_name}"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_athena_query" {
  name              = "${local.log_prefix}/lambda/${var.athena_lambda_name}"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "firehose" {
  name              = "${local.log_prefix}/firehose"
  retention_in_days = 30

  tags = local.common_tags
}


# ─── CloudWatch Alarm: Lambda Error Rate ──────────────────────────────────────
# Triggers when Lambda errors exceed 5 in a 5-minute period (across both functions)

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "nettribe-${var.environment}-lambda-error-rate"
  alarm_description   = "Lambda function errors exceed 5 in 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "total_errors"
    expression  = "telemetry_errors + athena_errors"
    label       = "Total Lambda Errors"
    return_data = true
  }

  metric_query {
    id = "telemetry_errors"

    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"

      dimensions = {
        FunctionName = var.telemetry_lambda_name
      }
    }
  }

  metric_query {
    id = "athena_errors"

    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"

      dimensions = {
        FunctionName = var.athena_lambda_name
      }
    }
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = local.common_tags
}

# ─── CloudWatch Alarm: Firehose Delivery Freshness ────────────────────────────
# Triggers when data freshness exceeds 300 seconds (5 minutes)

resource "aws_cloudwatch_metric_alarm" "firehose_freshness" {
  alarm_name          = "nettribe-${var.environment}-firehose-freshness"
  alarm_description   = "Firehose delivery freshness exceeds 300 seconds"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DeliveryToS3.DataFreshness"
  namespace           = "AWS/Firehose"
  period              = 300
  statistic           = "Maximum"
  threshold           = 300
  treat_missing_data  = "notBreaching"

  dimensions = {
    DeliveryStreamName = var.firehose_stream_name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = local.common_tags
}

# ─── CloudWatch Alarm: Athena Daily Scan Cost ─────────────────────────────────
# Triggers when processed bytes exceed 10GB per day (cost control)

resource "aws_cloudwatch_metric_alarm" "athena_cost" {
  alarm_name          = "nettribe-${var.environment}-athena-scan-cost"
  alarm_description   = "Athena daily scan exceeds 10GB ProcessedBytes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ProcessedBytes"
  namespace           = "AWS/Athena"
  period              = 86400
  statistic           = "Sum"
  threshold           = 10737418240 # 10 GB in bytes
  treat_missing_data  = "notBreaching"

  dimensions = {
    WorkGroup = "primary"
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = local.common_tags
}
