FROM mcr.microsoft.com/dotnet/core/aspnet:5.0-alpine AS base

WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/core/sdk:5.0-buster AS build

#Installing nodejs

RUN apt-get update -yq \
    && apt-get install curl gnupg -yq \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash \
    && apt-get install nodejs -yq

#Installing gulp

RUN npm install -g gulp

WORKDIR /src

COPY ["src/sample-library-proj/sample-library-proj.csproj.csproj", "src/sample-library-proj/"]
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

#setting release mode for node packages and webpacking 
ENV NODE_ENV="Release"
RUN npm install -g webpack
RUN npm install -g webpack-cli
RUN gulp build
RUN dotnet build "mvc-sample-app.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "mvc-sample-app.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app


ENV ApplicationDetails__SecretKey=SecretKeyPassedThroughEnvironmentVariable
ENV AppSettings__EnableHTTPS="false"


COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "mvc-sample-app.dll"]