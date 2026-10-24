resource "aws_security_group" "k3s_node" {
  name        = "${var.environment}-deployforge-node-sg"
  description = "Security group for DeployForge K3s single-node instance"
  vpc_id      = var.vpc_id

  # HTTP
  ingress {
    description = "Allow HTTP traffic to Traefik Ingress"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    description = "Allow HTTPS traffic to Traefik Ingress"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH
  ingress {
    description = "Allow SSH management access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  # Kubernetes API
  ingress {
    description = "Allow remote kubectl to K3s API"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  # Egress: allow all outbound internet traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-deployforge-sg"
    Environment = var.environment
  }
}
