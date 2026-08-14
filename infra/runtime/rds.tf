resource "random_password" "db" {
  length  = 24
  special = false # avoid characters that need URL-encoding in a DB_URL
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnets"
  subnet_ids = local.public_subnet_ids
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project}-db"
  engine         = "postgres"
  engine_version = "16"

  # Free-tier eligible instance class + storage, if this account still
  # qualifies (750 hrs/month + 20GB, first 12 months).
  instance_class    = "db.t4g.micro"
  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = "booking_dev"
  username = "postgres"
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [local.rds_sg_id]
  publicly_accessible    = false

  multi_az            = false
  skip_final_snapshot  = true
  deletion_protection  = false
  backup_retention_period = 0 # demo data is reseeded on every redeploy; skip backup storage cost

  apply_immediately = true
}
