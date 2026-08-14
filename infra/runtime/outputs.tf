output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "app_url" {
  value = "http://${aws_lb.main.dns_name}"
}

output "api_url" {
  value = "http://${aws_lb.main.dns_name}/api/v1"
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "ecr_api_url" {
  value = local.ecr_api_url
}

output "ecr_frontend_url" {
  value = local.ecr_frontend_url
}

output "db_password" {
  value     = random_password.db.result
  sensitive = true
}
