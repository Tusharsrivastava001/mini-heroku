output "instance_id" {
  value       = aws_instance.k3s_node.id
  description = "The ID of the EC2 instance"
}

output "public_ip" {
  value       = aws_eip.k3s_ip.public_ip
  description = "The static Elastic IP address of the node"
}
