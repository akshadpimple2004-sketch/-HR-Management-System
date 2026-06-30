resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket for HR Documents
resource "aws_s3_bucket" "documents" {
  bucket        = "${var.project_name}-documents-bucket-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name        = "${var.project_name}-documents-bucket"
    Environment = var.environment
  }
}

# Block Public Access to Documents Bucket
resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Frontend Hosting (served via CloudFront)
resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.project_name}-frontend-bucket-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name        = "${var.project_name}-frontend-bucket"
    Environment = var.environment
  }
}

# Block Public Access to Frontend Bucket (CloudFront will access via OAI/OAC)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
