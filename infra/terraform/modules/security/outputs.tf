output "security_group_id" {
  value       = aws_security_group.k3s_node.id
  description = "The ID of the K3s node security group"
}
