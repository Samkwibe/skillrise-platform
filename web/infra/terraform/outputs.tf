output "app_url" {
  value       = "https://${aws_apprunner_service.web.service_url}"
  description = "Public HTTPS URL for the App Runner service"
}

output "ecr_repository_url" {
  value       = aws_ecr_repository.app.repository_url
  description = "Push container images here, then bump var.app_image_tag"
}

output "dynamodb_table" {
  value       = aws_dynamodb_table.skillrise.name
  description = "Single-table DynamoDB name; set DYNAMO_TABLE to this value"
}

output "uploads_bucket" {
  value       = aws_s3_bucket.uploads.bucket
  description = "S3 bucket for user uploads"
}

output "cognito_user_pool_id" {
  value       = aws_cognito_user_pool.users.id
  description = "COGNITO_USER_POOL_ID"
}

output "cognito_user_pool_client_id" {
  value       = aws_cognito_user_pool_client.web.id
  description = "COGNITO_CLIENT_ID"
}

output "cognito_domain" {
  value       = aws_cognito_user_pool_domain.main.domain
  description = "Hosted UI domain prefix"
}
