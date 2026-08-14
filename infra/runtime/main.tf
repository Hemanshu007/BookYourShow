terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

variable "region" {
  default = "ap-south-1"
}

variable "project" {
  default = "bookyourshow"
}

variable "mail_username" {
  description = "Gmail address used to send OTP/ticket emails"
  type        = string
  # No default on purpose — set in the gitignored terraform.tfvars instead
  # of hardcoding a real personal email into version-controlled source.
}

variable "mail_password" {
  description = "Gmail app password (16 chars, spaces stripped)"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  default = "placeholder-google-client-id"
}

variable "google_client_secret" {
  type      = string
  sensitive = true
  default   = "placeholder-google-client-secret"
}

variable "omdb_api_key" {
  default = "placeholder-omdb-key"
}

variable "image_tag" {
  description = "Tag applied to the images already pushed to ECR before this apply"
  default     = "latest"
}

provider "aws" {
  region = var.region
}

# Reads outputs from the foundation layer's local state file instead of
# duplicating VPC/subnet/SG/ECR/IAM definitions here — foundation is applied
# once and left alone; this layer is the part that gets torn down and
# recreated between uses.
data "terraform_remote_state" "foundation" {
  backend = "local"
  config = {
    path = "../foundation/terraform.tfstate"
  }
}

locals {
  vpc_id            = data.terraform_remote_state.foundation.outputs.vpc_id
  public_subnet_ids = data.terraform_remote_state.foundation.outputs.public_subnet_ids
  alb_sg_id         = data.terraform_remote_state.foundation.outputs.alb_sg_id
  ecs_tasks_sg_id   = data.terraform_remote_state.foundation.outputs.ecs_tasks_sg_id
  rds_sg_id         = data.terraform_remote_state.foundation.outputs.rds_sg_id
  redis_sg_id       = data.terraform_remote_state.foundation.outputs.redis_sg_id
  ecr_api_url       = data.terraform_remote_state.foundation.outputs.ecr_api_url
  ecr_frontend_url  = data.terraform_remote_state.foundation.outputs.ecr_frontend_url
  exec_role_arn     = data.terraform_remote_state.foundation.outputs.ecs_execution_role_arn
  task_role_arn     = data.terraform_remote_state.foundation.outputs.ecs_task_role_arn
}
