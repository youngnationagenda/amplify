###############################################################################
# CORS Configuration — Environment-Specific
#
# CORS origins are passed via the cors_allowed_origins variable, allowing
# per-environment configuration:
#   - Dev:  ["http://localhost:5173", "http://localhost:3000"]
#   - Prod: ["https://nettribe.xyz"]
#
# Note: The cors_configuration block is defined inline on the
# aws_apigatewayv2_api resource in main.tf using var.cors_allowed_origins.
# This file documents the CORS strategy and provides defaults via the
# variable definition in variables.tf.
###############################################################################

# CORS is configured directly on the HTTP API resource in main.tf via:
#
#   cors_configuration {
#     allow_origins = var.cors_allowed_origins
#     allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
#     allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"]
#     max_age       = 86400
#   }
#
# Environment-specific values are passed from the root module:
#
#   module "api_gateway" {
#     source              = "./modules/api-gateway"
#     cors_allowed_origins = var.environment == "prod"
#       ? ["https://nettribe.xyz"]
#       : ["http://localhost:5173", "http://localhost:3000"]
#   }

locals {
  # Default CORS origins for dev environments (used as fallback)
  default_dev_origins = ["http://localhost:5173", "http://localhost:3000"]

  # Production CORS origins
  default_prod_origins = ["https://nettribe.xyz"]

  # Resolved origins — prefer explicit variable, fall back to environment-based defaults
  resolved_cors_origins = length(var.cors_allowed_origins) > 0 ? var.cors_allowed_origins : (
    var.environment == "prod" ? local.default_prod_origins : local.default_dev_origins
  )
}
