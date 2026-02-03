pipeline {
  agent any

  environment {
    DEPLOY_HOST = "192.168.1.5"
    DEPLOY_USER = "deploy"
    DEPLOY_DIR  = "/opt/hello-webapp/releases"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
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

    stage('Deploy Blue/Green + Health + Switch') {
      steps {
        sh '''
          set -e

          JAR=$(ls target/*.jar | head -n 1)
          BASENAME=$(basename "$JAR")
          echo "Deploying $BASENAME using Blue/Green"

          # Prepare directories on deploy server
          ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} \
            "mkdir -p ${DEPLOY_DIR} /opt/hello-webapp/logs"

          # Copy jar to deploy server
          scp -o StrictHostKeyChecking=no "$JAR" \
            ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR}/

          # Run blue/green logic ON deploy server
          ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} bash -s <<'REMOTE'
            set -ex

            DEPLOY_DIR="/opt/hello-webapp/releases"
            LOG_DIR="/opt/hello-webapp/logs"

            UPSTREAM_LINK="/etc/nginx/conf.d/hello_upstream.conf"
            BLUE_CONF="/etc/nginx/conf.d/upstreams/hello_upstream_blue.conf"
            GREEN_CONF="/etc/nginx/conf.d/upstreams/hello_upstream_green.conf"

            BLUE_PORT=8086
            GREEN_PORT=8087

            ACTIVE_CONF=$(readlink -f "$UPSTREAM_LINK" 2>/dev/null || true)
            echo "Active upstream file: $ACTIVE_CONF"

            if [ "$ACTIVE_CONF" = "$BLUE_CONF" ]; then
              ACTIVE_PORT=$BLUE_PORT
              TARGET_PORT=$GREEN_PORT
              TARGET_CONF=$GREEN_CONF
              TARGET_COLOR="GREEN"
            else
              ACTIVE_PORT=$GREEN_PORT
              TARGET_PORT=$BLUE_PORT
              TARGET_CONF=$BLUE_CONF
              TARGET_COLOR="BLUE"
            fi

            echo "Active port: $ACTIVE_PORT"
            echo "Target port: $TARGET_PORT ($TARGET_COLOR)"

            JAR_PATH=$(ls -t "$DEPLOY_DIR"/*.jar | head -n 1)
            LOG_FILE="$LOG_DIR/app-$TARGET_PORT.log"

            PID=$(lsof -ti tcp:$TARGET_PORT || true)
            if [ -n "$PID" ]; then
              echo "Stopping existing process on $TARGET_PORT (PID $PID)"
              kill "$PID"
              sleep 2
            fi

            echo "Starting new version on $TARGET_PORT"
            nohup java -jar "$JAR_PATH" \
              --server.port=$TARGET_PORT \
              > "$LOG_FILE" 2>&1 &

            echo "Waiting for app to become healthy on $TARGET_PORT..."
            HEALTH=""
            for i in $(seq 1 20); do
              HEALTH=$(curl -s http://127.0.0.1:$TARGET_PORT/actuator/health || true)
              if echo "$HEALTH" | grep -q '"status":"UP"'; then
                break
              fi
              sleep 2
            done

            echo "Health response: $HEALTH"

            if echo "$HEALTH" | grep -q '"status":"UP"'; then
              echo "Health OK ✅ switching traffic to $TARGET_COLOR"

              # SWITCH TRAFFIC (NON-INTERACTIVE SUDO, FULL PATHS)
              sudo -n /bin/ln -sf "$TARGET_CONF" "$UPSTREAM_LINK"
              sudo -n /usr/sbin/nginx -t
              sudo -n /usr/bin/systemctl reload nginx

              echo "Switched traffic to $TARGET_COLOR ($TARGET_PORT)"
            else
              echo "Health FAILED ❌ rolling back"
              NEWPID=$(lsof -ti tcp:$TARGET_PORT || true)
              if [ -n "$NEWPID" ]; then
                kill "$NEWPID" || true
              fi
              exit 1
            fi
REMOTE
        '''
      }
    }
  }
}
