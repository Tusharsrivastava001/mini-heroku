variable "environment" {
  type        = string
  description = "Environment name"
  default     = "prod"
}

variable "public_subnet_id" {
  type        = string
  description = "Public subnet ID"
}

variable "security_group_id" {
  type        = string
  description = "Security group ID"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type"
  default     = "t3.medium"
}

variable "disk_size_gb" {
  type        = number
  description = "Size of EBS root volume in GB"
  default     = 40
}

variable "ssh_public_key" {
  type        = string
  description = "Optional SSH public key string for EC2 access"
  default     = ""
}

variable "letsencrypt_email" {
  type        = string
  description = "Email address for Let's Encrypt TLS notifications"
  default     = "admin@deployforge.local"
}
