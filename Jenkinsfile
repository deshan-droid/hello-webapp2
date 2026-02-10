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
    SSH_CRED_ID = "azure-vm-ssh"     // <-- Jenkins credential ID 

    // App artifact
    JAR_NAME = "spring-boot-complete-0.0.1-SNAPSHOT.jar"

    // Remote paths
    REMOTE_STACK_DIR = "/opt/bluegreen"
    REMOTE_APP_DIR   = "/opt/bluegreen/app"
    REMOTE_UPLOAD    = "/tmp/jenkins_upload"

    // Image tagging
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
        sh label: 'Maven build', script: '''#!/usr/bin/env bash
set -euo pipefail
mvn -v
mvn clean package -DskipTests
ls -lh target/${JAR_NAME}
'''
      }
    }

    stage('Deploy to Azure (Docker Compose)') {
      steps {
        sshagent(credentials: [env.SSH_CRED_ID]) {
          sh label: 'Deploy', script: '''#!/usr/bin/env bash
set -euo pipefail

echo "==> Upload JAR to Azure..."
ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "mkdir -p ${REMOTE_UPLOAD}"
scp -o StrictHostKeyChecking=no target/${JAR_NAME} ${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_UPLOAD}/${JAR_NAME}

echo "==> Remote deploy on Azure..."
ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "bash -lc '
set -euo pipefail

echo \"[1/8] Ensure directories + ownership\"
sudo mkdir -p ${REMOTE_APP_DIR} ${REMOTE_STACK_DIR}/nginx/conf.d
sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} ${REMOTE_STACK_DIR}

echo \"[2/8] Verify docker + compose\"
docker version >/dev/null
docker compose version

echo \"[3/8] Move artifact into build context\"
mv -f ${REMOTE_UPLOAD}/${JAR_NAME} ${REMOTE_APP_DIR}/${JAR_NAME}

echo \"[4/8] Build image ${IMAGE_NAME}\"
cd ${REMOTE_APP_DIR}
docker build -t ${IMAGE_NAME} .

echo \"[5/8] Write .env for compose image\"
echo IMAGE_NAME=${IMAGE_NAME} > ${REMOTE_STACK_DIR}/.env

echo \"[6/8] Bring stack down cleanly (idempotent)\"
cd ${REMOTE_STACK_DIR}
docker compose down --remove-orphans || true

echo \"[7/8] Start stack\"
docker compose up -d

echo \"[7.1/8] Restart nginx to reload config reliably\"
docker compose restart nginx

echo \"[8/8] Health checks (retry up to 90s)\"
# Check containers directly first (bypasses nginx)
i=1
while [ "$i" -le 45 ]; do
  if curl -fsS http://localhost:8086/actuator/health >/dev/null 2>&1 \
     && curl -fsS http://localhost:8087/actuator/health >/dev/null 2>&1; then
    echo "Backends UP"
    break
  fi
  echo "Waiting for backends... ($i)"
  sleep 2
  i=$((i+1))
done

# Now check through nginx (this is your real user path)
i=1
while [ "$i" -le 45 ]; do
  if curl -fsS http://localhost/actuator/health >/dev/null 2>&1; then
    echo "Nginx route OK"
    echo "DEPLOY_OK"
    exit 0
  fi
  echo "Waiting for nginx route... ($i)"
  sleep 2
  i=$((i+1))
done

echo \"--- DEBUG: docker compose ps ---\"
docker compose ps || true

echo \"--- DEBUG: nginx last logs ---\"
docker compose logs --tail=80 nginx || true

echo \"--- DEBUG: app-blue last logs ---\"
docker compose logs --tail=80 app-blue || true

echo \"--- DEBUG: app-green last logs ---\"
docker compose logs --tail=80 app-green || true

echo \"Health check failed\"
exit 22
'"

echo "==> Deploy stage finished."
'''
        }
      }
    }
  }

  post {
    always {
      echo "Build finished: ${currentBuild.currentResult}"
    }
  }
}
