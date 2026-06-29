###############################################################################
# NetTribe Infrastructure — Main Terraform Configuration
#
# Architecture:
#   evtelemetryai:       API Gateway → Lambda → Kinesis Firehose → S3 → Athena
#   nettribexyz:         Amplify Hosting (frontend) + Amplify Backend (Lambda/AppSync)
#   nettribeblockchain:  CI/CD only (Hardhat compile/deploy in pipeline)
#
# Communication Layer:
#   API Gateway as unified router with Cognito authorizer
###############################################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration uses partial configuration.
  # The state key is environment-specific and must be passed at init time:
  #   terraform init -backend-config="key=infra/ENV/terraform.tfstate"
  #
  # Examples:
  #   terraform init -backend-config="key=infra/dev/terraform.tfstate"
  #   terraform init -backend-config="key=infra/staging/terraform.tfstate"
  #   terraform init -backend-config="key=infra/prod/terraform.tfstate"
  backend "s3" {
    bucket         = "nettribe-terraform-state"
    key            = "infra/dev/terraform.tfstate" # Default; override via -backend-config at init
    region         = "us-east-1"
    dynamodb_table = "nettribe-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "nettribe"
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  }
}

# ─── Modules ───────────────────────────────────────────────────────────────────

module "telemetry_pipeline" {
  source = "./modules/telemetry-pipeline"

  environment          = var.environment
  telemetry_bucket     = var.telemetry_bucket
  firehose_stream_name = var.firehose_stream_name
  athena_database      = var.athena_database
  athena_workgroup     = var.athena_workgroup
}

module "api_gateway" {
  source = "./modules/api-gateway"

  environment              = var.environment
  cognito_user_pool_id     = var.cognito_user_pool_id
  telemetry_lambda_arn     = module.telemetry_pipeline.ingest_lambda_arn
  athena_lambda_arn        = var.athena_lambda_arn
  api_name                 = "nettribe-api"
}

module "monitoring" {
  source = "./modules/monitoring"

  environment          = var.environment
  firehose_stream_name = var.firehose_stream_name
}
