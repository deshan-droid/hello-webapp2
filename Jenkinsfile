pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    // Azure VM
    DEPLOY_HOST = "20.205.33.17"
    DEPLOY_USER = "azureuser"
    SSH_CRED_ID = "azure-vm-ssh"   // Jenkins credential ID

    // App artifact
    JAR_NAME = "spring-boot-complete-0.0.1-SNAPSHOT.jar"

    // Remote paths
    REMOTE_STACK_DIR = "/opt/bluegreen"
    REMOTE_APP_DIR   = "/opt/bluegreen/app"
    REMOTE_UPLOAD    = "/tmp/jenkins_upload"

    // Image tag
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
        sh(label: 'Maven build', script: '''
          set -e
          mvn -v
          mvn clean package -DskipTests
          ls -lh target/${JAR_NAME}
        ''')
      }
    }

    stage('Deploy to Azure (Docker Compose)') {
      steps {
        sshagent(credentials: [env.SSH_CRED_ID]) {
          sh(label: 'Deploy (bash)', script: """
            bash -euo pipefail <<'LOCAL'
            echo "==> Upload JAR to Azure..."
            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "mkdir -p ${REMOTE_UPLOAD}"
            scp -o StrictHostKeyChecking=no target/${JAR_NAME} ${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_UPLOAD}/${JAR_NAME}

            echo "==> Remote deploy on Azure..."
            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} \\
              DEPLOY_USER='${DEPLOY_USER}' \\
              REMOTE_STACK_DIR='${REMOTE_STACK_DIR}' \\
              REMOTE_APP_DIR='${REMOTE_APP_DIR}' \\
              REMOTE_UPLOAD='${REMOTE_UPLOAD}' \\
              JAR_NAME='${JAR_NAME}' \\
              IMAGE_NAME='${IMAGE_NAME}' \\
              bash -se <<'REMOTE'
            set -euo pipefail

            echo "[1/7] Ensure dirs + ownership"
            sudo mkdir -p "\$REMOTE_APP_DIR" "\$REMOTE_STACK_DIR/nginx/conf.d"
            sudo chown -R "\$DEPLOY_USER:\$DEPLOY_USER" "\$REMOTE_STACK_DIR"

            echo "[2/7] Move JAR into build context"
            mv -f "\$REMOTE_UPLOAD/\$JAR_NAME" "\$REMOTE_APP_DIR/\$JAR_NAME"

            echo "[3/7] Build image: \$IMAGE_NAME"
            cd "\$REMOTE_APP_DIR"
            docker build -t "\$IMAGE_NAME" .

            echo "[4/7] Write .env"
            echo "IMAGE_NAME=\$IMAGE_NAME" > "\$REMOTE_STACK_DIR/.env"

            echo "[5/7] Recreate stack"
            cd "\$REMOTE_STACK_DIR"
            docker compose down --remove-orphans || true
            docker compose up -d

            echo "[6/7] Restart nginx (avoid 502 race)"
            docker compose restart nginx

            echo "[7/7] Health check with retry"
            i=1
            while [ "\$i" -le 45 ]; do
              if curl -fsS http://localhost/actuator/health >/dev/null 2>&1; then
                echo "DEPLOY_OK"
                exit 0
              fi
              echo "Waiting for nginx route... (\$i)"
              sleep 2
              i=\$((i+1))
            done

            echo "--- DEBUG: ps ---"
            docker compose ps || true

            echo "--- DEBUG: nginx logs ---"
            docker compose logs --tail=120 nginx || true

            echo "--- DEBUG: app-blue logs ---"
            docker compose logs --tail=120 app-blue || true

            echo "--- DEBUG: app-green logs ---"
            docker compose logs --tail=120 app-green || true

            echo "Health check failed"
            exit 22
REMOTE

            echo "==> Deploy stage finished."
LOCAL
          """)
        }
      }
    }

  } // end stages

  post {
    always {
      echo "Build finished: ${currentBuild.currentResult}"
    }
  }

} // end pipeline
