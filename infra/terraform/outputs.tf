output "public_ip" {
  value       = module.compute.public_ip
  description = "The static Elastic IP address of your DeployForge K3s node"
}

output "instance_id" {
  value       = module.compute.instance_id
  description = "The EC2 Instance ID"
}

output "vpc_id" {
  value       = module.network.vpc_id
  description = "VPC ID"
}

output "kubeconfig_command" {
  value       = "ssh ubuntu@${module.compute.public_ip} 'sudo cat /etc/rancher/k3s/k3s.yaml' | sed 's/127.0.0.1/${module.compute.public_ip}/g' > kubeconfig"
  description = "Command to download and configure your remote kubeconfig"
}

output "wildcard_dns_instruction" {
  value       = "Create a DNS A-record pointing '*.yourdomain.com' to ${module.compute.public_ip}"
  description = "DNS Wildcard record setup"
}
