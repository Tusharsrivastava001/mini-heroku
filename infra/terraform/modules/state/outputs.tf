output "state_bucket_name" {
  value       = aws_s3_bucket.tf_state.bucket
  description = "The S3 bucket name for Terraform remote state"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.tf_locks.name
  description = "The DynamoDB table name for Terraform state locking"
}
