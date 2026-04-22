resource "aws_cognito_user_pool" "users" {
  name = "${local.name_prefix}-users"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  auto_verified_attributes = ["email"]

  username_attributes = ["email"]

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  mfa_configuration = "OFF"

  tags = local.tags
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${local.name_prefix}-web"
  user_pool_id = aws_cognito_user_pool.users.id

  generate_secret                               = false
  allowed_oauth_flows_user_pool_client          = true
  allowed_oauth_flows                           = ["code"]
  allowed_oauth_scopes                          = ["openid", "email", "profile"]
  supported_identity_providers                  = ["COGNITO"]
  prevent_user_existence_errors                 = "ENABLED"
  explicit_auth_flows                           = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"]
  callback_urls                                 = ["https://${var.domain_name == "" ? "localhost:3000" : var.domain_name}/api/auth/callback"]
  logout_urls                                   = ["https://${var.domain_name == "" ? "localhost:3000" : var.domain_name}/login"]
  access_token_validity                         = 60
  id_token_validity                             = 60
  refresh_token_validity                        = 30
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project}-${var.environment}-${random_id.suffix.hex}"
  user_pool_id = aws_cognito_user_pool.users.id
}
