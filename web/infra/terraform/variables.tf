variable "project" {
  description = "Short project slug used for resource names"
  type        = string
  default     = "skillrise"
}

variable "environment" {
  description = "Environment (e.g. dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "app_image_tag" {
  description = "Container image tag deployed to App Runner (set to the image digest or tag you've pushed to ECR)"
  type        = string
  default     = "latest"
}

variable "app_runner_cpu" {
  description = "App Runner CPU (1024, 2048, 4096)"
  type        = string
  default     = "1024"
}

variable "app_runner_memory" {
  description = "App Runner memory in MB (2048, 3072, 4096)"
  type        = string
  default     = "2048"
}

variable "openai_api_key" {
  description = "OpenAI API key stored as a secret and injected at runtime"
  type        = string
  sensitive   = true
  default     = ""
}

variable "data_store" {
  description = "Runtime data store: memory | mongodb | dynamodb"
  type        = string
  default     = "dynamodb"
}

variable "mongodb_uri" {
  description = "MongoDB connection string (only used when data_store = mongodb)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "domain_name" {
  description = "Optional custom domain for the app (e.g. app.skillrise.dev). Leave blank to use the App Runner-provided URL."
  type        = string
  default     = ""
}
