resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/apprunner/${local.name_prefix}"
  retention_in_days = 30
  tags              = local.tags
}

resource "aws_cloudwatch_metric_alarm" "http_5xx" {
  alarm_name          = "${local.name_prefix}-5xx-high"
  namespace           = "AWS/AppRunner"
  metric_name         = "5xxStatusResponse"
  statistic           = "Sum"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 5
  evaluation_periods  = 2
  period              = 60
  treat_missing_data  = "notBreaching"

  dimensions = {
    ServiceName = aws_apprunner_service.web.service_name
  }

  alarm_description = "App Runner service is returning too many 5xx responses"
  tags              = local.tags
}
