data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# IAM Role for EC2
resource "aws_iam_role" "node_role" {
  name = "${var.environment}-deployforge-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "profile" {
  name = "${var.environment}-deployforge-node-profile"
  role = aws_iam_role.node_role.name
}

# Elastic IP
resource "aws_eip" "k3s_ip" {
  domain = "vpc"

  tags = {
    Name        = "${var.environment}-deployforge-eip"
    Environment = var.environment
  }
}

# Key Pair (optional)
resource "aws_key_pair" "admin" {
  count      = var.ssh_public_key != "" ? 1 : 0
  key_name   = "${var.environment}-deployforge-key"
  public_key = var.ssh_public_key
}

# EC2 Instance
resource "aws_instance" "k3s_node" {
  ami                  = data.aws_ami.ubuntu.id
  instance_type        = var.instance_type
  subnet_id            = var.public_subnet_id
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile = aws_iam_instance_profile.profile.name
  key_name             = var.ssh_public_key != "" ? aws_key_pair.admin[0].key_name : null

  root_block_device {
    volume_size           = var.disk_size_gb
    volume_type           = "gp3"
    iops                  = 3000
    throughput            = 125
    delete_on_termination = true
  }

  user_data = <<-EOF
              #!/bin/bash
              set -ex

              # 1. Update and install base tooling
              apt-get update -y
              apt-get install -y curl git jq apt-transport-https ca-certificates gnupg

              # 2. Get Public Elastic IP
              EIP="${aws_eip.k3s_ip.public_ip}"

              # 3. Install K3s (Single-Node Lightweight Kubernetes)
              # Include EIP in TLS SAN so remote kubectl works out of the box
              curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--tls-san $EIP --write-kubeconfig-mode 644" sh -

              # 4. Wait for K3s readiness
              until kubectl get nodes | grep -q " Ready"; do
                echo "Waiting for K3s node to be Ready..."
                sleep 5
              done

              # 5. Install Helm
              curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

              # 6. Install cert-manager for automatic TLS certificates
              helm repo add jetstack https://charts.jetstack.io
              helm repo update
              helm install cert-manager jetstack/cert-manager \
                --namespace cert-manager \
                --create-namespace \
                --version v1.15.3 \
                --set crds.enabled=true

              # 7. Configure Let's Encrypt ClusterIssuer
              cat <<YAML | kubectl apply -f -
              apiVersion: cert-manager.io/v1
              kind: ClusterIssuer
              metadata:
                name: letsencrypt-prod
              spec:
                acme:
                  server: https://acme-v02.api.letsencrypt.org/directory
                  email: ${var.letsencrypt_email}
                  privateKeySecretRef:
                    name: letsencrypt-prod-key
                  solvers:
                  - http01:
                      ingress:
                        class: traefik
              YAML

              echo "DeployForge K3s bootstrap completed successfully!" > /var/log/deployforge-init.log
              EOF

  tags = {
    Name        = "${var.environment}-deployforge-node"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Associate EIP with EC2 Instance
resource "aws_eip_association" "eip_assoc" {
  instance_id   = aws_instance.k3s_node.id
  allocation_id = aws_eip.k3s_ip.id
}
