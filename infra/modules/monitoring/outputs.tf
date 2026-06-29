###############################################################################
# Monitoring Module — Outputs
###############################################################################

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarm notifications"
  value       = aws_sns_topic.alarms.arn
}

output "lambda_error_alarm_arn" {
  description = "ARN of the Lambda error rate CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.lambda_errors.arn
}

output "firehose_freshness_alarm_arn" {
  description = "ARN of the Firehose delivery freshness CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.firehose_freshness.arn
}

output "athena_cost_alarm_arn" {
  description = "ARN of the Athena daily scan cost CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.athena_cost.arn
}
