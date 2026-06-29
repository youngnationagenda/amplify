variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID for JWT authorizer"
  type        = string
}

variable "telemetry_lambda_arn" {
  description = "ARN of the telemetry ingestion Lambda"
  type        = string
  default     = ""
}

variable "athena_lambda_arn" {
  description = "ARN of the Athena query Lambda"
  type        = string
  default     = ""
}

variable "cors_allowed_origins" {
  description = "List of allowed CORS origins. If empty, defaults are derived from environment (localhost for dev, production domain for prod)."
  type        = list(string)
  default     = []
}
