resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project}-redis-subnets"
  subnet_ids = local.public_subnet_ids
}

resource "aws_elasticache_cluster" "main" {
  cluster_id = "${var.project}-redis"
  engine     = "redis"

  # Free-tier eligible node type, if this account still qualifies.
  node_type       = "cache.t3.micro"
  num_cache_nodes = 1
  port            = 6379

  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [local.redis_sg_id]
}
