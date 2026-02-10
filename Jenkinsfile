pipeline {
  agent any

  environment {
    DEPLOY_HOST = "20.205.33.17"
    DEPLOY_USER = "azureuser"
    SSH_CRED_ID = "azure-vm-ssh"

    JAR_NAME = "spring-boot-complete-0.0.1-SNAPSHOT.jar"
    REMOTE_APP_DIR = "/opt/bluegreen/app"
    REMOTE_STACK_DIR = "/opt/bluegreen"
    IMAGE_NAME = "hello-webapp:${BUILD_NUMBER}"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build JAR') {
      steps {
        sh '''
          set -e
          mvn clean package -DskipTests
          ls -lh target/${JAR_NAME}
        '''
      }
    }

    stage('Deploy to Azure (Docker Compose)') {
      steps {
        sshagent(credentials: [env.SSH_CRED_ID]) {
          sh '''
            set -e

            echo "Upload JAR to Azure..."
            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "mkdir -p /tmp/jenkins_upload"
            scp -o StrictHostKeyChecking=no target/${JAR_NAME} ${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/jenkins_upload/${JAR_NAME}

            echo "Build Docker image + restart compose on Azure..."
            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
              set -e
              sudo mkdir -p ${REMOTE_APP_DIR}
              sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} /opt/bluegreen

              mv /tmp/jenkins_upload/${JAR_NAME} ${REMOTE_APP_DIR}/${JAR_NAME}

              cd ${REMOTE_APP_DIR}
              docker build -t ${IMAGE_NAME} .

              echo IMAGE_NAME=${IMAGE_NAME} > ${REMOTE_STACK_DIR}/.env

              cd ${REMOTE_STACK_DIR}
             docker compose up -d
             docker compose restart nginx

             # wait up to 60s for nginx + app to be ready
              for i in $(seq 1 30); do
                 if curl -sSf http://localhost/actuator/health >/dev/null; then
               echo "HEALTH_OK"
              break
             fi
             echo "Waiting for health... ($i)"
            sleep 2
            done

           # final check (will fail the build if still not OK)
           curl -sSf http://localhost/actuator/health >/dev/null

              echo DEPLOY_OK
            "
          '''
        }
      }
    }

  }
}
