pipeline {
  agent any

  environment {
    DEPLOY_HOST = "192.168.1.5"
    DEPLOY_USER = "deploy"
    DEPLOY_DIR  = "/opt/hello-webapp/releases"
    LOG_FILE    = "/opt/hello-webapp/logs/app-8086.log"
    APP_PORT    = "8086"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build') {
      steps {
        sh '''
          set -e
          mvn -U -DskipTests clean package
          ls -lh target/*.jar
        '''
      }
    }

    stage('Deploy via SSH') {
      steps {
        sh '''
          set -e
          JAR=$(ls target/*.jar | head -n 1)
          BASENAME=$(basename "$JAR")
          echo "Deploying $BASENAME to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR}"

          # Ensure dirs exist
          ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "mkdir -p ${DEPLOY_DIR} /opt/hello-webapp/logs"

          # Copy jar
          scp -o StrictHostKeyChecking=no "$JAR" ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR}/

          # Stop any old instance on APP_PORT and start new
          ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
            set -e
            PID=\$(lsof -ti tcp:${APP_PORT} || true)
            if [ -n \"\$PID\" ]; then
              echo \"Stopping PID \$PID on port ${APP_PORT}\"
              kill \$PID
              sleep 2
            fi

            echo \"Starting ${BASENAME} on port ${APP_PORT}\"
            nohup java -jar ${DEPLOY_DIR}/${BASENAME} --server.port=${APP_PORT} > ${LOG_FILE} 2>&1 &
            sleep 3
            echo \"Started. Log: ${LOG_FILE}\"
          "
        '''
      }
    }
  }
}
