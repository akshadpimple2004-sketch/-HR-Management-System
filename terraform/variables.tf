variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "hr-system"
}

variable "environment" {
  description = "Target deployment environment"
  type        = string
  default     = "production"
}

variable "db_username" {
  description = "Username for the RDS MySQL database"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "Password for the RDS MySQL database"
  type        = string
  sensitive   = true
  default     = "HRsystemSecurePass2026!"
}

variable "db_name" {
  description = "Name of the RDS MySQL database"
  type        = string
  default     = "hr_management"
}

variable "ec2_key_name" {
  description = "Key pair name for SSH access to EC2 instance"
  type        = string
  default     = "hr-system-ec2-key"
}
