###############################################################################
# API Gateway Module — Unified Router
#
# Routes:
#   POST /telemetry     → telemetry-ingest Lambda (evtelemetryai)
#   POST /athena        → athena-query Lambda (analytics)
#   /platform/*         → AppSync (handled by Amplify, not routed here)
#
# Auth: Cognito User Pool authorizer
###############################################################################

# ─── HTTP API (API Gateway v2) ────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "nettribe_api" {
  name          = "${var.api_name}-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = local.resolved_cors_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"]
    max_age       = 86400
  }

  tags = {
    Component = "api-gateway"
  }
}

# ─── Cognito Authorizer ───────────────────────────────────────────────────────

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.nettribe_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-authorizer"

  jwt_configuration {
    audience = [var.cognito_user_pool_id]
    issuer   = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

data "aws_region" "current" {}

# ─── Stage ────────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.nettribe_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      path           = "$context.path"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      latency        = "$context.responseLatency"
      error          = "$context.error.message"
    })
  }
}

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/nettribe-api-${var.environment}"
  retention_in_days = 30
}

# ─── Telemetry Route (POST /telemetry) ────────────────────────────────────────

resource "aws_apigatewayv2_integration" "telemetry_lambda" {
  count = var.telemetry_lambda_arn != "" ? 1 : 0

  api_id                 = aws_apigatewayv2_api.nettribe_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.telemetry_lambda_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "telemetry_post" {
  count = var.telemetry_lambda_arn != "" ? 1 : 0

  api_id             = aws_apigatewayv2_api.nettribe_api.id
  route_key          = "POST /telemetry"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
  target             = "integrations/${aws_apigatewayv2_integration.telemetry_lambda[0].id}"
}

# ─── Athena Route (POST /athena) ──────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "athena_lambda" {
  count = var.athena_lambda_arn != "" ? 1 : 0

  api_id                 = aws_apigatewayv2_api.nettribe_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.athena_lambda_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "athena_post" {
  count = var.athena_lambda_arn != "" ? 1 : 0

  api_id             = aws_apigatewayv2_api.nettribe_api.id
  route_key          = "POST /athena"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
  target             = "integrations/${aws_apigatewayv2_integration.athena_lambda[0].id}"
}

# ─── Health Check (public, no auth) ──────────────────────────────────────────

resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.nettribe_api.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.health.id}"
}

resource "aws_apigatewayv2_integration" "health" {
  api_id             = aws_apigatewayv2_api.nettribe_api.id
  integration_type   = "HTTP_PROXY"
  integration_method = "GET"
  integration_uri    = "https://httpstat.us/200"
}
