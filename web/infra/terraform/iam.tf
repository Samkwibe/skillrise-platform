data "aws_iam_policy_document" "apprunner_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["tasks.apprunner.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "apprunner_build_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["build.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apprunner_task" {
  name               = "${local.name_prefix}-apprunner-task"
  assume_role_policy = data.aws_iam_policy_document.apprunner_assume.json
  tags               = local.tags
}

resource "aws_iam_role" "apprunner_access" {
  name               = "${local.name_prefix}-apprunner-access"
  assume_role_policy = data.aws_iam_policy_document.apprunner_build_assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "apprunner_access_ecr" {
  role       = aws_iam_role.apprunner_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

data "aws_iam_policy_document" "app_runtime" {
  statement {
    sid    = "DynamoAccess"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
    ]
    resources = [
      aws_dynamodb_table.skillrise.arn,
      "${aws_dynamodb_table.skillrise.arn}/index/*",
    ]
  }

  statement {
    sid    = "S3Uploads"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.uploads.arn,
      "${aws_s3_bucket.uploads.arn}/*",
    ]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:${var.aws_region}:*:*"]
  }

  statement {
    sid    = "ReadSecrets"
    effect = "Allow"
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      aws_secretsmanager_secret.openai_api_key.arn,
      aws_secretsmanager_secret.mongodb_uri.arn,
    ]
  }

  statement {
    sid    = "CognitoAdmin"
    effect = "Allow"
    actions = [
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminInitiateAuth",
      "cognito-idp:ListUsers",
    ]
    resources = [aws_cognito_user_pool.users.arn]
  }
}

resource "aws_iam_policy" "app_runtime" {
  name   = "${local.name_prefix}-runtime"
  policy = data.aws_iam_policy_document.app_runtime.json
}

resource "aws_iam_role_policy_attachment" "apprunner_task_runtime" {
  role       = aws_iam_role.apprunner_task.name
  policy_arn = aws_iam_policy.app_runtime.arn
}
