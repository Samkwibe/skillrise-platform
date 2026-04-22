locals {
  name_prefix = "${var.project}-${var.environment}"
  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "random_id" "suffix" {
  byte_length = 3
}
