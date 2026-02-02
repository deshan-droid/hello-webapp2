pipeline {
  agent any

  environment {
    MVN_OPTS = "-DskipTests"
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
          mvn -v
          mvn clean package ${MVN_OPTS}
          ls -lh target/*.jar
        '''
      }
    }

    stage('Archive') {
      steps {
        archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
      }
    }
  }
}
