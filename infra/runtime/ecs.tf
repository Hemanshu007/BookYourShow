resource "aws_ecs_cluster" "main" {
  name = "${var.project}-cluster"
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project}-api"
  retention_in_days = 3 # short retention keeps this at effectively $0
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.project}-frontend"
  retention_in_days = 3
}

locals {
  alb_origin = "http://${aws_lb.main.dns_name}"
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = local.exec_role_arn
  task_role_arn            = local.task_role_arn

  container_definitions = jsonencode([{
    name    = "api"
    image   = "${local.ecr_api_url}:${var.image_tag}"
    command = ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    portMappings = [{ containerPort = 8000, protocol = "tcp" }]

    environment = [
      { name = "REDIS_HOST", value = aws_elasticache_cluster.main.cache_nodes[0].address },
      { name = "REDIS_PORT", value = "6379" },
      { name = "REDIS_URL", value = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:6379" },
      { name = "MAIL_USERNAME", value = var.mail_username },
      { name = "MAIL_FROM", value = var.mail_username },
      { name = "MAIL_PORT", value = "587" },
      { name = "MAIL_SERVER", value = "smtp.gmail.com" },
      { name = "JWT_ACCESS_TOKEN_EXPIRE_MINUTES", value = "30" },
      { name = "JWT_REFRESH_TOKEN_EXPIRE_DAYS", value = "7" },
      { name = "JWT_ALGORITHM", value = "HS256" },
      { name = "GOOGLE_CLIENT_ID", value = var.google_client_id },
      { name = "GOOGLE_REDIRECT_URI", value = "${local.alb_origin}/api/v1/auth/google/callback" },
      { name = "OMDB_API_KEY", value = var.omdb_api_key },
      # Elasticsearch intentionally skipped for this deployment — the app's
      # graceful-degradation fix (see git history) means search returns
      # empty results instead of crashing on a bad/unreachable ES_URL.
      { name = "ES_URL", value = "http://es-disabled.invalid:9200" },
      { name = "ENV", value = "PRODUCTION" },
      { name = "FRONTEND_URL", value = local.alb_origin },
      { name = "CORS_ORIGINS", value = local.alb_origin },
    ]

    secrets = [
      { name = "DB_URL", valueFrom = "${aws_secretsmanager_secret.api.arn}:DB_URL::" },
      { name = "TEST_DB_URL", valueFrom = "${aws_secretsmanager_secret.api.arn}:TEST_DB_URL::" },
      { name = "JWT_SECRET_ACCESS_KEY", valueFrom = "${aws_secretsmanager_secret.api.arn}:JWT_SECRET_ACCESS_KEY::" },
      { name = "JWT_SECRET_REFRESH_KEY", valueFrom = "${aws_secretsmanager_secret.api.arn}:JWT_SECRET_REFRESH_KEY::" },
      { name = "ENCRYPTION_PASSWORD", valueFrom = "${aws_secretsmanager_secret.api.arn}:ENCRYPTION_PASSWORD::" },
      { name = "ENCRYPTION_STATIC_SALT", valueFrom = "${aws_secretsmanager_secret.api.arn}:ENCRYPTION_STATIC_SALT::" },
      { name = "MAIL_PASSWORD", valueFrom = "${aws_secretsmanager_secret.api.arn}:MAIL_PASSWORD::" },
      { name = "GOOGLE_CLIENT_SECRET", valueFrom = "${aws_secretsmanager_secret.api.arn}:GOOGLE_CLIENT_SECRET::" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "api"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.project}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = local.exec_role_arn
  task_role_arn            = local.task_role_arn

  container_definitions = jsonencode([{
    name         = "frontend"
    image        = "${local.ecr_frontend_url}:${var.image_tag}"
    portMappings = [{ containerPort = 80, protocol = "tcp" }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "frontend"
      }
    }
  }])
}

resource "aws_ecs_service" "api" {
  name            = "${var.project}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = local.public_subnet_ids
    security_groups  = [local.ecs_tasks_sg_id]
    assign_public_ip = true # no NAT Gateway — tasks need a public IP to reach ECR/Gmail/OMDB
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name    = "api"
    container_port    = 8000
  }

  # Don't block the apply waiting for a healthy task if the image hasn't
  # been pushed to ECR yet — the runtime layer's first apply creates the
  # ALB before any image exists; the service is force-redeployed once the
  # real image lands.
  wait_for_steady_state = false

  depends_on = [aws_lb_listener.http, aws_lb_listener_rule.api]
}

resource "aws_ecs_service" "frontend" {
  name            = "${var.project}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = local.public_subnet_ids
    security_groups  = [local.ecs_tasks_sg_id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name    = "frontend"
    container_port    = 80
  }

  wait_for_steady_state = false

  depends_on = [aws_lb_listener.http]
}
