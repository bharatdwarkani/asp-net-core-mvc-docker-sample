FROM mcr.microsoft.com/dotnet/aspnet:5.0-buster-slim AS base

# During time of preparing sample alphine image was not available
# It is better to use alphine as base for reducing image size

# FROM mcr.microsoft.com/dotnet/core/aspnet:5.0-alpine AS base

WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:5.0-buster-slim AS build

#Installing nodejs

RUN apt-get update -yq \
    && apt-get install curl gnupg -yq \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash \
    && apt-get install nodejs -yq

#Installing gulp

RUN npm install -g gulp

WORKDIR /src

COPY ["src/sample-library-proj/sample-library-proj.csproj", "src/sample-library-proj/"]
COPY ["src/mvc-sample-app/mvc-sample-app.csproj", "src/mvc-sample-app/"]
COPY ["src/mvc-sample-app/package.json", "src/mvc-sample-app/"]
COPY *.config .

WORKDIR "/src/src/mvc-sample-app"

#Installing npm packages
RUN npm install

WORKDIR /src

RUN dotnet restore "src/mvc-sample-app/mvc-sample-app.csproj" --disable-parallel --configfile ./nuget.config 
COPY . .
WORKDIR "/src/src/mvc-sample-app"

# setting release mode for node packages and webpacking to use minified files for production
# set this to Debug if you need debug build
ENV NODE_ENV="Release"
RUN npm install -g webpack
RUN npm install -g webpack-cli
RUN gulp build
RUN dotnet build "mvc-sample-app.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "mvc-sample-app.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app

# Sample of environement variable which can be passed through docker. Note replace a json settings using double undersscore
# check appsettings.json file in project you will find similar settings.
# appsettings.json settings will be overridden by env variables passed from here
ENV ApplicationDetails__SecretKey=SecretKeyPassedThroughEnvironmentVariable
ENV AppSettings__EnableHTTPS="false"


COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "mvc-sample-app.dll"]