variable "environment" {
  type        = string
  description = "Environment name"
  default     = "prod"
}

variable "aws_account_id" {
  type        = string
  description = "AWS Account ID used to uniquely name the S3 state bucket"
}
