variable "aws_region" {
  type        = string
  description = "AWS region to deploy resources into"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
  default     = "prod"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type        = string
  description = "Public subnet CIDR block"
  default     = "10.0.1.0/24"
}

variable "admin_cidr" {
  type        = string
  description = "CIDR block permitted to access SSH (port 22) and K8s API (port 6443)"
  default     = "0.0.0.0/0"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance size (t3.medium is the recommended low-cost minimum)"
  default     = "t3.medium"
}

variable "disk_size_gb" {
  type        = number
  description = "EBS root volume size in GB"
  default     = 40
}

variable "ssh_public_key" {
  type        = string
  description = "SSH public key contents for direct EC2 SSH access"
  default     = ""
}

variable "letsencrypt_email" {
  type        = string
  description = "Email used by cert-manager for TLS notifications"
  default     = "admin@deployforge.local"
}
