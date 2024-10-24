pipeline {
    agent { 
        node {
            label 'docker-agent-nextjs'
        }
    }
    options {
        timestamps()
    }
    environment { 
		DOCKER_IMAGE = 'shopify-webgpu'
        CONTAINER_NAME = 'shopify-webgpu-container'
	}
	triggers {
		pollSCM '*/5 * * * *'
	}
    stages {
        // stage('Environment Check') {
        //     steps {
        //         sh 'env | sort'
        //     }
        // }
        // stage('Debug Docker Connection') {
        //     steps {
        //         sh 'cat /etc/hosts'
        //         sh 'ping -c 4 docker'
        //         sh 'nslookup docker'
        //         sh 'echo $DOCKER_HOST'
        //         sh 'env | grep DOCKER'
        //     }
        // }
        stage('Test Docker') {
            steps {
                script {
                    sh 'docker version'
                    // sh 'docker info'
                }
            }
        }
        stage('Docker Build') {
            steps {
                script {
                    // Build the Docker image
                    sh "docker  build -t ${DOCKER_IMAGE}:${env.BUILD_NUMBER} ."
                }
            }
        }
        stage('Deploy') {
            steps {
                script {
                    // Stop and remove the old container if it exists
                    sh "docker stop ${CONTAINER_NAME} || true"
                    sh "docker rm ${CONTAINER_NAME} || true"
                    
                    // Run the new container
                    sh "docker run -d --name ${CONTAINER_NAME} -p 3420:3000 -v /home/prod/shopify-webgpu/environmet_variables/.env:/app/.env ${DOCKER_IMAGE}:${env.BUILD_NUMBER}"
                }
            }
        }
        // stage('Debug') {
        //     steps {
        //         sh 'docker ps -a'
        //         sh 'docker images'
        //         sh 'docker logs ${CONTAINER_NAME} || true'
        //     }
        // }
        stage('Debug') {
            steps {
                sh 'ls -l /var/run/docker.sock'
                sh 'id'
                sh 'groups'
                sh 'docker version'
            }
        }
        stage('Verify') {
            steps {
                script {
                    sh "docker ps | grep ${CONTAINER_NAME}"
                }
            }
        }
    }
}