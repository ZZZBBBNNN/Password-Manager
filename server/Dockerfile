# Dockerfile 构建自己的镜像
FROM node:18-alpine
#读取官方镜像node:18 运行环境是liunx发行版alpine

# Set working directory
WORKDIR /app 
#在容器内创建并切换到 /app 目录。
#后续的 COPY、RUN 等命令默认在此目录下执行。

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production
#复制package.json 和 package-lock.json 到 容器中./app目录下
#因为依赖费时间 利用docker缓存 如果依赖没有修改可以跳过这一步 实现加速
#安装 依赖 用RUN执行控制台terminal

# Copy application code
COPY . .
#将宿主机当前目录的所有文件（除 .dockerignore 声明的文件外）复制到容器内的 /app

# Create a non-root user and switch to it
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
#在终端创建组 并创建用户在组中 并使用该用户 目的是防止以root用户运行权限太大造成系统损失

# Expose port
EXPOSE 3000
#开放docker的3000端口

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1

# 参数说明：

# --interval=30s：每 30 秒检查一次。

# --timeout=10s：超时时间为 10 秒。

# --start-period=30s：容器启动后 30 秒内不标记为失败（允许应用初始化）。

# --retries=3：连续 3 次失败后判定为不健康。

# 检查命令：
# wget -q --spider 静默检查 /health 端点（需应用实现该路由），失败时返回 exit 1。
  
  
# Start application
CMD ["node", "server.js"]

#在终端启动服务器