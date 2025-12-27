resource "aws_vpc" "cv_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "cv-vpc"
  }
}

resource "aws_internet_gateway" "cv_igw" {
  vpc_id = aws_vpc.cv_vpc.id
  tags = {
    Name = "cv-igw"
  }
}

resource "aws_subnet" "cv_subnet" {
  vpc_id                  = aws_vpc.cv_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1a"
  tags = {
    Name = "cv-subnet"
  }
}

resource "aws_route_table" "cv_route_table" {
  vpc_id = aws_vpc.cv_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.cv_igw.id
  }
  tags = {
    Name = "cv-route-table"
  }
}

resource "aws_route_table_association" "cv_route_table_assoc" {
  subnet_id      = aws_subnet.cv_subnet.id
  route_table_id = aws_route_table.cv_route_table.id
}

resource "aws_security_group" "cv_sg" {
  name        = "cv-sg"
  description = "Allow HTTP access on port 3000"
  vpc_id      = aws_vpc.cv_vpc.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "cv-sg"
  }
}
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
}
provider "aws" {
  region = "us-east-1"
}

resource "aws_ecs_cluster" "cv_cluster" {
  name = "cv-nextjs-cluster"
}

resource "aws_ecs_task_definition" "cv_task" {
  family                   = "cv-nextjs-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"      # 0.25 vCPU (minimum for Fargate)
  memory                   = "512"      # 0.5 GB (minimum for Fargate)
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "cv-nextjs-app"
      image     = "rajatjangra2653/cv-nextjs:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
    }
  ])
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecsTaskExecutionRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_ecs_service" "cv_service" {
  name            = "cv-nextjs-service"
  cluster         = aws_ecs_cluster.cv_cluster.id
  task_definition = aws_ecs_task_definition.cv_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.cv_subnet.id]
    assign_public_ip = true
    security_groups  = [aws_security_group.cv_sg.id]
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.cv_cluster.name
}

output "ecs_service_name" {
  value = aws_ecs_service.cv_service.name
}

output "ecs_task_definition_arn" {
  value = aws_ecs_task_definition.cv_task.arn
}
