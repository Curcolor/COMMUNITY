#!/bin/bash

# Definir el directorio base del proyecto
PROJECT_NAME="community-mvp"
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Función para crear .gitkeep en directorios vacíos
create_gitkeep() {
    find . -type d -empty -exec touch {}/.gitkeep \;
}

# Crear estructura principal simplificada
mkdir -p {src,tests,deploy,docs}

# Crear estructura de src
cd src

# Crear estructura de microservicios
mkdir -p Microservices/{Users,Posts}

# Estructura para el microservicio de Users
cd Microservices/Users
mkdir -p {Api,Core,Infrastructure}
cd Api
mkdir -p {Controllers,DTOs}
touch Controllers/.gitkeep
touch DTOs/.gitkeep
cd ../Core
mkdir -p {Entities,Interfaces,Services}
touch Entities/.gitkeep
touch Interfaces/.gitkeep
touch Services/.gitkeep
cd ../Infrastructure
mkdir -p {Data,Repositories}
touch Data/.gitkeep
touch Repositories/.gitkeep
cd ../../..

# Estructura para el microservicio de Posts
cd Microservices/Posts
mkdir -p {Api,Core,Infrastructure}
cd Api
mkdir -p {Controllers,DTOs}
touch Controllers/.gitkeep
touch DTOs/.gitkeep
cd ../Core
mkdir -p {Entities,Interfaces,Services}
touch Entities/.gitkeep
touch Interfaces/.gitkeep
touch Services/.gitkeep
cd ../Infrastructure
mkdir -p {Data,Repositories}
touch Data/.gitkeep
touch Repositories/.gitkeep
cd ../../..

# Agregar el proyecto Blazor
mkdir -p WebUI/CommunityBlazor
cd WebUI/CommunityBlazor
mkdir -p {Pages,Shared,Components,Services,wwwroot,Models}

# Crear PostDto.cs
cat > Models/PostDto.cs << EOF
namespace CommunityBlazor.Models;

public class PostDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public string AuthorName { get; set; }
}
EOF

# Crear archivos básicos de Blazor
cat > Pages/Index.razor << EOF
@page "/"
@using CommunityBlazor.Models

<PageTitle>Community MVP</PageTitle>

<MudContainer Class="mt-16 px-8" MaxWidth="MaxWidth.False">
    <MudGrid>
        <MudItem xs="12" sm="6">
            <MudPaper Class="pa-4">
                <MudText Typo="Typo.h4">Bienvenido a Community</MudText>
                <MudText Class="mt-4">Plataforma para conectar voluntarios con oportunidades.</MudText>
            </MudPaper>
        </MudItem>
        <MudItem xs="12" sm="6">
            <MudPaper Class="pa-4">
                <MudText Typo="Typo.h5">Últimas Publicaciones</MudText>
                @if (posts == null)
                {
                    <MudProgressCircular Color="Color.Primary" Indeterminate="true" />
                }
                else
                {
                    @foreach (var post in posts)
                    {
                        <MudCard Class="mt-4">
                            <MudCardContent>
                                <MudText Typo="Typo.h6">@post.Title</MudText>
                                <MudText>@post.Description</MudText>
                                <MudText Typo="Typo.body2">Por: @post.AuthorName</MudText>
                                <MudText Typo="Typo.body2">@post.CreatedAt.ToString("dd/MM/yyyy")</MudText>
                            </MudCardContent>
                        </MudCard>
                    }
                }
            </MudPaper>
        </MudItem>
    </MudGrid>
</MudContainer>

@code {
    private List<PostDto> posts;

    protected override async Task OnInitializedAsync()
    {
        // Datos de ejemplo
        posts = new List<PostDto>
        {
            new PostDto 
            { 
                Id = 1, 
                Title = "Voluntariado en Hospital", 
                Description = "Se buscan voluntarios para apoyo en hospital local",
                CreatedAt = DateTime.Now,
                AuthorName = "Juan Pérez"
            },
            new PostDto 
            { 
                Id = 2, 
                Title = "Ayuda en Comedor Social", 
                Description = "Necesitamos voluntarios para el comedor social del barrio",
                CreatedAt = DateTime.Now.AddDays(-1),
                AuthorName = "María García"
            }
        };
    }
}
EOF

# Crear archivo de proyecto Blazor
cat > CommunityBlazor.csproj << EOF
<Project Sdk="Microsoft.NET.Sdk.BlazorWebAssembly">

  <PropertyGroup>
    <TargetFramework>net7.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly" Version="7.0.0" />
    <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly.DevServer" Version="7.0.0" />
    <PackageReference Include="MudBlazor" Version="6.11.0" />
  </ItemGroup>

</Project>
EOF

# Crear Program.cs para Blazor
cat > Program.cs << EOF
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using CommunityBlazor;
using MudBlazor.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddMudServices();

await builder.Build().RunAsync();
EOF

# Crear _Imports.razor
cat > _Imports.razor << EOF
@using System.Net.Http
@using System.Net.Http.Json
@using Microsoft.AspNetCore.Components.Forms
@using Microsoft.AspNetCore.Components.Routing
@using Microsoft.AspNetCore.Components.Web
@using Microsoft.AspNetCore.Components.Web.Virtualization
@using Microsoft.AspNetCore.Components.WebAssembly.Http
@using MudBlazor
@using CommunityBlazor
@using CommunityBlazor.Shared
@using CommunityBlazor.Models
EOF

# Crear App.razor
cat > App.razor << EOF
<MudThemeProvider/>
<MudDialogProvider/>
<MudSnackbarProvider/>

<Router AppAssembly="@typeof(App).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" />
        <FocusOnNavigate RouteData="@routeData" Selector="h1" />
    </Found>
    <NotFound>
        <PageTitle>Not found</PageTitle>
        <LayoutView Layout="@typeof(MainLayout)">
            <MudText Typo="Typo.h4">Lo sentimos, esta página no existe.</MudText>
        </LayoutView>
    </NotFound>
</Router>
EOF

# Crear MainLayout.razor
mkdir -p Shared
cat > Shared/MainLayout.razor << EOF
@inherits LayoutComponentBase

<MudLayout>
    <MudAppBar Elevation="1">
        <MudText Typo="Typo.h5" Class="ml-3">Community MVP</MudText>
        <MudSpacer />
        <MudIconButton Icon="@Icons.Material.Filled.MoreVert" Color="Color.Inherit" Edge="Edge.End" />
    </MudAppBar>
    <MudMainContent>
        @Body
    </MudMainContent>
</MudLayout>
EOF

# Crear wwwroot/index.html
mkdir -p wwwroot
cat > wwwroot/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Community MVP</title>
    <base href="/" />
    <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
    <link href="_content/MudBlazor/MudBlazor.min.css" rel="stylesheet" />
</head>
<body>
    <div id="app">
        <div style="position:absolute; top:30vh; width:100%; text-align:center">
            <h1>Community MVP</h1>
            <div>Cargando...</div>
        </div>
    </div>

    <script src="_framework/blazor.webassembly.js"></script>
    <script src="_content/MudBlazor/MudBlazor.min.js"></script>
</body>
</html>
EOF

cd ../../..

# Agregar .gitkeep a todos los directorios vacíos
create_gitkeep

echo "Estructura MVP del proyecto creada exitosamente en: $(pwd)/$PROJECT_NAME"
echo "Se ha agregado la interfaz de usuario con Blazor y MudBlazor"
echo "Para ejecutar el proyecto:"
echo "1. cd src/WebUI/CommunityBlazor"
echo "2. dotnet run"