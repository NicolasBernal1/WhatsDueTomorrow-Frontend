pipeline {
    agent any

    environment {
        SCANNER_HOME = tool 'SonarScanner'
        CHROME_BIN = '/usr/bin/chromium'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npx ng test --no-watch --no-progress --browsers=ChromeHeadless --code-coverage'
            }
        }

        stage('SonarCloud Analysis + Quality Gate') {
            steps {
                withSonarQubeEnv('SonarCloud-Frontend') {
                    sh """
                        ${SCANNER_HOME}/bin/sonar-scanner \
                          -Dsonar.qualitygate.wait=true \
                          -Dsonar.qualitygate.timeout=300
                    """
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t whatsduetomorrow-frontend:latest -f dockerfile .'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker rm -f whatsduetomorrow-frontend || true
                    docker run -d \
                      --name whatsduetomorrow-frontend \
                      --network devops-net \
                      -p 4200:4200 \
                      whatsduetomorrow-frontend:latest
                '''
            }
        }
    }

    post {
        always {
            echo "Pipeline frontend finalizado: ${currentBuild.currentResult}"
        }
    }
}
