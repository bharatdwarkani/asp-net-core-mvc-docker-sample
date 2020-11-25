#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:5.0-buster-slim AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:5.0-buster-slim AS build
WORKDIR /src
COPY ["mvc-sample-app.csproj", ""]
RUN dotnet restore "./mvc-sample-app.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "mvc-sample-app.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "mvc-sample-app.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "mvc-sample-app.dll"]