terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }

  # Uncomment after running `terraform apply -target=module.state`
  # backend "s3" {
  #   bucket         = "prod-deployforge-tfstate-REPLACE_WITH_ACCOUNT_ID"
  #   key            = "deployforge/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "prod-deployforge-tflocks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "DeployForge"
      ManagedBy = "Terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

module "network" {
  source             = "./modules/network"
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  public_subnet_cidr = var.public_subnet_cidr
  availability_zone  = "${var.aws_region}a"
}

module "security" {
  source      = "./modules/security"
  environment = var.environment
  vpc_id      = module.network.vpc_id
  admin_cidr  = var.admin_cidr
}

module "compute" {
  source            = "./modules/compute"
  environment       = var.environment
  public_subnet_id  = module.network.public_subnet_id
  security_group_id = module.security.security_group_id
  instance_type     = var.instance_type
  disk_size_gb      = var.disk_size_gb
  ssh_public_key    = var.ssh_public_key
  letsencrypt_email = var.letsencrypt_email
}

module "state" {
  source         = "./modules/state"
  environment    = var.environment
  aws_account_id = data.aws_caller_identity.current.account_id
}
