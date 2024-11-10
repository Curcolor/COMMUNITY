#!/bin/bash

# Función para crear .gitkeep en un directorio
create_gitkeep() {
    touch "$1/.gitkeep"
}

# Definir el directorio base del proyecto
PROJECT_NAME="community-project"
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Crear estructura principal
mkdir -p {.github/workflows,src,tests,deploy,docs,scripts}
create_gitkeep ".github/workflows"

# Crear estructura de src
cd src
mkdir -p {Frontend,Gateway,Microservices,Shared}

# Frontend
cd Frontend
mkdir -p CommunityBlazor/{Pages,Components,Services,Models,wwwroot,Shared}
for dir in CommunityBlazor/{Pages,Components,Services,Models,wwwroot,Shared}; do
    create_gitkeep "$dir"
done
cd ..

# Gateway
cd Gateway
mkdir -p CommunityGateway/{Configuration,Middleware,Services,Extensions}
for dir in CommunityGateway/{Configuration,Middleware,Services,Extensions}; do
    create_gitkeep "$dir"
done
cd ..

# Microservicios
cd Microservices

# Función para crear estructura de microservicio
create_microservice() {
    mkdir -p $1/{API,Application,Domain,Infrastructure}
    
    # API structure
    mkdir -p $1/API/{Controllers,Middleware,Extensions}
    for dir in $1/API/{Controllers,Middleware,Extensions}; do
        create_gitkeep "$dir"
    done
    
    # Application structure
    mkdir -p $1/Application/{Commands,Queries,Validators,Mappings}
    mkdir -p $1/Application/Commands/{CreateUser,UpdateUser}
    mkdir -p $1/Application/Queries/GetUser
    for dir in $1/Application/{Commands,Queries,Validators,Mappings}; do
        create_gitkeep "$dir"
    done
    for dir in $1/Application/Commands/{CreateUser,UpdateUser}; do
        create_gitkeep "$dir"
    done
    create_gitkeep "$1/Application/Queries/GetUser"
    
    # Domain structure
    mkdir -p $1/Domain/{Entities,Events,ValueObjects}
    for dir in $1/Domain/{Entities,Events,ValueObjects}; do
        create_gitkeep "$dir"
    done
    
    # Infrastructure structure
    mkdir -p $1/Infrastructure/{Persistence,Services,Repositories}
    mkdir -p $1/Infrastructure/Persistence/{Configurations,Migrations}
    for dir in $1/Infrastructure/{Persistence,Services,Repositories}; do
        create_gitkeep "$dir"
    done
    for dir in $1/Infrastructure/Persistence/{Configurations,Migrations}; do
        create_gitkeep "$dir"
    done
}

# Crear estructura para cada microservicio
for SERVICE in Users Search Volunteers Posts Notifications ExternalIntegration Location; do
    create_microservice $SERVICE
done

cd ..

# Shared
cd Shared
mkdir -p CommunityCommon/{Constants,Extensions,Models,Utils}
for dir in CommunityCommon/{Constants,Extensions,Models,Utils}; do
    create_gitkeep "$dir"
done
cd ..

# Volver al directorio raíz
cd ..

# Tests
cd tests
mkdir -p {Unit,Integration}

# Unit tests
cd Unit
for SERVICE in Users Search Volunteers Posts Notifications ExternalIntegration Location; do
    mkdir -p "${SERVICE}.Tests"
    create_gitkeep "${SERVICE}.Tests"
done
cd ..

# Integration tests
cd Integration
for SERVICE in Users Search Volunteers Posts Notifications ExternalIntegration Location; do
    mkdir -p "${SERVICE}.Integration.Tests"
    create_gitkeep "${SERVICE}.Integration.Tests"
done
cd ..
cd ..

# Deploy
cd deploy
mkdir -p {docker,kubernetes,terraform}
mkdir -p docker/services
mkdir -p kubernetes/{base,overlays}
mkdir -p kubernetes/overlays/{development,staging,production}
mkdir -p terraform/{modules,environments}

# Crear .gitkeep en directorios de deploy
create_gitkeep "docker/services"
for dir in kubernetes/overlays/{development,staging,production}; do
    create_gitkeep "$dir"
done
for dir in terraform/{modules,environments}; do
    create_gitkeep "$dir"
done
cd ..

# Docs
cd docs
mkdir -p {architecture,api,deployment,development}
for dir in {architecture,api,deployment,development}; do
    create_gitkeep "$dir"
done
cd ..

# Scripts
cd scripts
mkdir -p {build,deploy,database}
for dir in {build,deploy,database}; do
    create_gitkeep "$dir"
done
cd ..

# Crear archivos base
touch .gitignore README.md solution.sln
touch .github/workflows/{ci.yml,cd.yml}

# Crear docker-compose files
touch deploy/docker/docker-compose.yml
touch deploy/docker/docker-compose.override.yml

echo "Estructura del proyecto creada exitosamente en: $(pwd)/$PROJECT_NAME"
echo "Se han agregado archivos .gitkeep en todas las carpetas vacías"