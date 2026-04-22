resource "aws_secretsmanager_secret" "openai_api_key" {
  name        = "${local.name_prefix}/openai-api-key"
  description = "OpenAI API key for the SkillRise AI Tutor"
  tags        = local.tags
}

resource "aws_secretsmanager_secret_version" "openai_api_key" {
  count         = var.openai_api_key == "" ? 0 : 1
  secret_id     = aws_secretsmanager_secret.openai_api_key.id
  secret_string = var.openai_api_key
}

resource "aws_secretsmanager_secret" "mongodb_uri" {
  name        = "${local.name_prefix}/mongodb-uri"
  description = "MongoDB connection string (only used when DATA_STORE=mongodb)"
  tags        = local.tags
}

resource "aws_secretsmanager_secret_version" "mongodb_uri" {
  count         = var.mongodb_uri == "" ? 0 : 1
  secret_id     = aws_secretsmanager_secret.mongodb_uri.id
  secret_string = var.mongodb_uri
}
