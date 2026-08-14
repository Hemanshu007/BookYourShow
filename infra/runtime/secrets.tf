resource "random_password" "jwt_access" {
  length  = 48
  special = false
}

resource "random_password" "jwt_refresh" {
  length  = 48
  special = false
}

resource "random_password" "encryption_password" {
  length  = 32
  special = false
}

resource "random_password" "encryption_salt" {
  length  = 16
  special = false
}

# One secret holding every sensitive env var the API needs, injected into
# the task definition via valueFrom + jsonKey so nothing sensitive sits in
# plain task-definition environment variables (visible in the ECS console).
resource "aws_secretsmanager_secret" "api" {
  name                    = "${var.project}/api"
  recovery_window_in_days = 0 # demo project: allow immediate deletion on teardown, no 7-30 day recovery hold
}

resource "aws_secretsmanager_secret_version" "api" {
  secret_id = aws_secretsmanager_secret.api.id
  secret_string = jsonencode({
    DB_URL                          = "postgresql+asyncpg://postgres:${random_password.db.result}@${aws_db_instance.main.address}:5432/booking_dev"
    TEST_DB_URL                     = "postgresql+asyncpg://postgres:${random_password.db.result}@${aws_db_instance.main.address}:5432/booking_dev"
    JWT_SECRET_ACCESS_KEY           = random_password.jwt_access.result
    JWT_SECRET_REFRESH_KEY          = random_password.jwt_refresh.result
    ENCRYPTION_PASSWORD             = random_password.encryption_password.result
    ENCRYPTION_STATIC_SALT          = random_password.encryption_salt.result
    MAIL_PASSWORD                   = var.mail_password
    GOOGLE_CLIENT_SECRET            = var.google_client_secret
  })
}
