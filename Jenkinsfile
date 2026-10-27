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
                sh 'npx ng test --no-watch --no-progress --browsers=ChromeHeadlessCI --code-coverage'
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

        stage('Visual Regression Tests (Argos CI)') {
            steps {
                script {
                    sh 'npx playwright install --with-deps chromium'
                    sh 'npm run test:visual'

                    // Inspección Visual Inteligente y Análisis de Causa Raíz (RCA) con Agente de IA
                    sh 'npm run test:visual:ai-inspect || true'
                    
                    try {
                        withCredentials([string(credentialsId: 'ARGOS_TOKEN', variable: 'ARGOS_TOKEN')]) {
                            sh 'npx @argos-ci/cli upload ./screenshots --token "${ARGOS_TOKEN}"'
                        }
                    } catch (Exception e) {
                        echo "Aviso: Credencial ARGOS_TOKEN no configurada en Jenkins o servicio remoto no disponible: ${e.message}. Se procede archivando las capturas localmente."
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'screenshots/**, test-results-visual/**', allowEmptyArchive: true
                }
            }
        }

        stage('E2E Tests (Playwright Test Agents Suite)') {
            steps {
                script {
                    sh 'npx playwright install --with-deps chromium'
                    sh 'npm run test:e2e:agents'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'playwright-report/**, test-results/**', allowEmptyArchive: true
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
