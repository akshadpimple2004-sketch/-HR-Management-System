data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

# CloudWatch Log Group for Backend App Logs
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/ec2/${var.project_name}-backend"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# EC2 Instance for Node.js backend
resource "aws_instance" "backend" {
  ami                  = data.aws_ami.ubuntu.id
  instance_type        = "t3.micro"
  subnet_id            = aws_subnet.public_1.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
  key_name             = var.ec2_key_name

  user_data = <<-EOF
              #!/bin/bash
              # Update packages
              apt-get update -y
              apt-get upgrade -y

              # Install Node.js (NodeSource v20)
              curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
              apt-get install -y nodejs

              # Install PM2 globally
              npm install pm2 -g

              # Install Nginx and Git
              apt-get install -y nginx git curl unzip

              # Install AWS CloudWatch Agent
              wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazoncloudwatch-agent.deb
              dpkg -i -E ./amazoncloudwatch-agent.deb

              # Create a basic CloudWatch agent configuration
              mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/
              cat <<'INNER_EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
              {
                "agent": {
                  "metrics_collection_interval": 60,
                  "run_as_user": "cwagent"
                },
                "metrics": {
                  "append_dimensions": {
                    "InstanceId": "$${aws:InstanceId}"
                  },
                  "metrics_collected": {
                    "mem": {
                      "measurement": [
                        "mem_used_percent"
                      ]
                    },
                    "disk": {
                      "measurement": [
                        "used_percent"
                      ],
                      "resources": [
                        "/"
                      ]
                    }
                  }
                },
                "logs": {
                  "logs_collected": {
                    "files": {
                      "collect_list": [
                        {
                          "file_path": "/var/log/nginx/access.log",
                          "log_group_name": "/aws/ec2/${var.project_name}-nginx-access",
                          "log_stream_name": "{instance_id}",
                          "timestamp_format": "%d/%b/%Y:%H:%M:%S %z"
                        },
                        {
                          "file_path": "/var/log/nginx/error.log",
                          "log_group_name": "/aws/ec2/${var.project_name}-nginx-error",
                          "log_stream_name": "{instance_id}"
                        }
                      ]
                    }
                  }
                }
              }
              INNER_EOF

              # Start CloudWatch Agent
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

              # Enable services
              systemctl enable nginx
              systemctl start nginx

              # Setup backend directories
              mkdir -p /var/www/backend
              chown -R ubuntu:ubuntu /var/www/backend

              echo "Initialization completed successfully!"
              EOF

  tags = {
    Name        = "${var.project_name}-backend-instance"
    Environment = var.environment
  }
}

# Outputs for useful resource values
output "ec2_public_ip" {
  description = "Public IP of the backend EC2 instance"
  value       = aws_instance.backend.public_ip
}

output "rds_endpoint" {
  description = "Connection endpoint for the RDS instance"
  value       = aws_db_instance.mysql.endpoint
}

output "s3_documents_bucket" {
  description = "Name of the secure S3 document bucket"
  value       = aws_s3_bucket.documents.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.domain_name
}
