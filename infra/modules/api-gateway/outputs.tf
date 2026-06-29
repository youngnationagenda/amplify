output "api_url" {
  description = "Base URL of the HTTP API"
  value       = aws_apigatewayv2_api.nettribe_api.api_endpoint
}

output "api_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.nettribe_api.id
}

output "log_group_arn" {
  description = "ARN of the CloudWatch log group for API Gateway access logs"
  value       = aws_cloudwatch_log_group.api_logs.arn
}
