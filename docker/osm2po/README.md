build



```bash
# Only ONCE
# you need to copy the transportation data and server into this dir
cp -r ../../transportation/server transportation-service

docker build -t ahbpnw/ahb-os2po-transportation-service:v0.1 .
```

run

```bash
docker run -d --name=ahb-dst-transportation -p 8889:8889  ahbpnw/ahb-os2po-transportation-service:v0.1
```