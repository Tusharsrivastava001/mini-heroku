resource "aws_s3_bucket" "tf_state" {
  bucket        = "${var.environment}-deployforge-tfstate-${var.aws_account_id}"
  force_destroy = false

  tags = {
    Name        = "${var.environment}-deployforge-tfstate"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "tf_state_versioning" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state_crypto" {
  bucket = aws_s3_bucket.tf_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_dynamodb_table" "tf_locks" {
  name         = "${var.environment}-deployforge-tflocks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "${var.environment}-deployforge-tflocks"
    Environment = var.environment
  }
}
