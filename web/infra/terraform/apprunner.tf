resource "aws_apprunner_service" "web" {
  service_name = "${local.name_prefix}-web"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_access.arn
    }

    auto_deployments_enabled = true

    image_repository {
      image_identifier      = "${aws_ecr_repository.app.repository_url}:${var.app_image_tag}"
      image_repository_type = "ECR"

      image_configuration {
        port = "3000"

        runtime_environment_variables = {
          NODE_ENV                = "production"
          DATA_STORE              = var.data_store
          AWS_REGION              = var.aws_region
          DYNAMO_TABLE            = aws_dynamodb_table.skillrise.name
          UPLOADS_BUCKET          = aws_s3_bucket.uploads.bucket
          COGNITO_USER_POOL_ID    = aws_cognito_user_pool.users.id
          COGNITO_CLIENT_ID       = aws_cognito_user_pool_client.web.id
          COGNITO_DOMAIN          = aws_cognito_user_pool_domain.main.domain
        }

        runtime_environment_secrets = {
          OPENAI_API_KEY = aws_secretsmanager_secret.openai_api_key.arn
          MONGODB_URI    = aws_secretsmanager_secret.mongodb_uri.arn
        }
      }
    }
  }

  instance_configuration {
    cpu               = var.app_runner_cpu
    memory            = var.app_runner_memory
    instance_role_arn = aws_iam_role.apprunner_task.arn
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/api/auth/me"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 3
  }

  observability_configuration {
    observability_enabled = false
  }

  tags = local.tags
}

resource "aws_apprunner_auto_scaling_configuration_version" "main" {
  auto_scaling_configuration_name = "${local.name_prefix}-autoscale"
  max_concurrency                 = 100
  max_size                        = 10
  min_size                        = 1
  tags                            = local.tags
}
