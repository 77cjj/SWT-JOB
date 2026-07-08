docker run -d \
  --name postgres \
  -e POSTGRES_DB=ragent \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  pgvector/pgvector:pg16

---------------------------------

docker run  \
-p 6379:6379  \
--name redis  \
-d redis  \
redis-server  \
--requirepass "123456"


---------------------------------
name: rocketmq-stack

services:
  rmqnamesrv:
    image: apache/rocketmq:5.2.0
    platform: linux/amd64
    container_name: rmqnamesrv
    ports:
      - "9876:9876"
    environment:
      JAVA_OPT_EXT: "-Xms256m -Xmx400m"
    command: sh mqnamesrv
    networks:
      - rocketmq
    restart: unless-stopped
    healthcheck:
      test: [ "CMD-SHELL", "grep -q 'The Name Server boot success' /home/rocketmq/logs/rocketmqlogs/namesrv.log || exit 1" ]
      interval: 10s
      timeout: 5s
      retries: 10

  rmqbroker:
    image: apache/rocketmq:5.2.0
    platform: linux/amd64
    container_name: rmqbroker
    ports:
      - "10912:10912"
      - "10911:10911"
      - "10909:10909"
      - "8080:8080"
      - "8081:8081"
      - "8082:8082"                              # ← dashboard 端口也从这里暴露
    environment:
      NAMESRV_ADDR: "rmqnamesrv:9876"
      JAVA_OPT_EXT: "-Xms512m -Xmx512m"
    depends_on:
      rmqnamesrv:
        condition: service_healthy
    command:
      - sh
      - -c
      - |
        cat > /home/rocketmq/rocketmq-5.2.0/conf/broker.conf << EOF
        brokerClusterName = DefaultCluster
        brokerName = broker-a
        brokerId = 0
        deleteWhen = 04
        fileReservedTime = 48
        brokerRole = ASYNC_MASTER
        flushDiskType = ASYNC_FLUSH
        brokerIP1 = 127.0.0.1
        timerMaxDelaySec = 31622400
        EOF
        sh mqbroker --enable-proxy \
          -c /home/rocketmq/rocketmq-5.2.0/conf/broker.conf
    networks:
      - rocketmq
    restart: unless-stopped

  dashboard:
    image: apacherocketmq/rocketmq-dashboard:2.1.0
    platform: linux/amd64
    container_name: rocketmq-dashboard
    network_mode: "service:rmqbroker"            # ← 关键：共享 broker 网络栈
    environment:
      JAVA_OPTS: >-
        -Xms256m -Xmx512m
        -XX:MaxMetaspaceSize=256m
        -Drocketmq.config.enableDashBoardCollect=false
        -Drocketmq.namesrv.addr=rmqnamesrv:9876
        -Dserver.port=8082
    depends_on:
      rmqbroker:
        condition: service_started
    restart: unless-stopped

networks:
  rocketmq:
    driver: bridge

---------------------------------

    docker run -d \
    --name rustfs \
    -p 9000:9000 \
    -p 9001:9001 \
    -v rustfs-data:/data \
    -e RUSTFS_ACCESS_KEY=rustfsadmin \
    -e RUSTFS_SECRET_KEY=rustfsadmin \
    -e RUSTFS_CONSOLE_ENABLE=true \
    rustfs/rustfs:1.0.0-alpha.72 \
    --address :9000 \
    --console-enable \
    --access-key rustfsadmin \
    --secret-key rustfsadmin \
    /data