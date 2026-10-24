variable "environment" {
  type        = string
  description = "Environment name"
  default     = "prod"
}

variable "vpc_id" {
  type        = string
  description = "The ID of the VPC"
}

variable "admin_cidr" {
  type        = string
  description = "CIDR block permitted to access SSH and K8s API (e.g. 0.0.0.0/0 or your office/home IP)"
  default     = "0.0.0.0/0"
}
