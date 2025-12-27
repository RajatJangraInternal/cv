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
  cpu                      = "256"
  memory                   = "512"
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
    subnets          = ["subnet-xxxxxxxx"] # Replace with your subnet ID(s)
    assign_public_ip = true
    security_groups  = ["sg-xxxxxxxx"]    # Replace with your security group ID(s)
  }
}
