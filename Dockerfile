# См. статью по ссылке https://aka.ms/customizecontainer, чтобы узнать как настроить контейнер отладки и как Visual Studio использует этот Dockerfile для создания образов для ускорения отладки.

# Этот этап используется при запуске из VS в быстром режиме (по умолчанию для конфигурации отладки)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
#FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
RUN apt-get update && apt-get install -y build-essential
RUN apt-get --purge remove -y nvidia*

WORKDIR /app
EXPOSE 8080
EXPOSE 8081


# Этот этап используется для сборки проекта службы
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["BackendGermanSmartDetector.csproj", "."]
RUN dotnet restore "./BackendGermanSmartDetector.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "./BackendGermanSmartDetector.csproj" -c $BUILD_CONFIGURATION -o /app/build


# Этот этап используется для публикации проекта службы, который будет скопирован на последний этап
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./BackendGermanSmartDetector.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Этот этап используется в рабочей среде или при запуске из VS в обычном режиме (по умолчанию, когда конфигурация отладки не используется)
FROM base AS final
RUN apt update && apt upgrade -y && apt install gcc -y && apt install g++ -y
RUN apt -y install python3 pipx python3-pip 
RUN apt install ffmpeg -y
# Для CPU 
#RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu --break-system-packages
# для GPU
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124 --break-system-packages
WORKDIR /python
RUN mkdir -p /python/req
COPY ./Python/requirements.txt /python/req 
RUN pip install --no-cache-dir -r /python/req/requirements.txt --break-system-packages
RUN mkdir /app/Temp
WORKDIR /app
COPY ./Python /app/Python
COPY ./YoloModel /app/YoloModel
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BackendGermanSmartDetector.dll"]