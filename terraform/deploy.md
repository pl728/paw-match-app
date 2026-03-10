# instructions

 From the repo root, run these exact commands:

  cd /mnt/d/osu/W2026/cs_462/paw-match-app

  export TAG=$(date +%Y%m%d-%H%M%S)

  docker build -t us-central1-docker.pkg.dev/paw-match-1/paw-match/backend:$TAG ./backend
  docker push us-central1-docker.pkg.dev/paw-match-1/paw-match/backend:$TAG

  perl -0pi -e 's|^image\s*=.*$|image       = "us-central1-docker.pkg.dev/paw-match-1/paw-match/backend:'"$TAG"'"|m' terraform/terraform.tfvars    

  cd terraform
  terraform apply

  Do not rebuild the frontend for this fix.

  After terraform apply finishes, try the image upload again. If you want, I can also give you the exact command to verify the new bucket/env vars 
  landed in Cloud Run.

  
# pure gcloud

```
linpatr@PAT-PC:/mnt/d/osu/W2026/cs_462/paw-match-app$   export TAG=12a9679
linpatr@PAT-PC:/mnt/d/osu/W2026/cs_462/paw-match-app$   export BACKEND_URL="$(gcloud run services describe paw-match-backend --region=us-central1 --format='value(status.url)')"
linpatr@PAT-PC:/mnt/d/osu/W2026/cs_462/paw-match-app$   docker build -t us-central1-docker.pkg.dev/paw-match-1/paw-match/backend:$TAG ./backend
[+] Building 0.9s (10/10) FINISHED                                                                     docker:default 
 => [internal] load build definition from Dockerfile                                                             0.0s 
 => => transferring dockerfile: 266B                                                                             0.0s 
 => [internal] load metadata for docker.io/library/node:20-alpine                                                0.5s 
 => [internal] load .dockerignore                                                                                0.1s 
 => => transferring context: 68B                                                                                 0.0s 
 => [1/5] FROM docker.io/library/node:20-alpine@sha256:b88333c42c23fbd91596ebd7fd10de239cedab9617de04142dde7315  0.0s 
 => [internal] load build context                                                                                0.1s 
 => CACHED [5/5] COPY . .                                                                                        0.0s
 => exporting to image                                                                                           0.0s
 => => exporting layers                                                                                          0.0s
 => => writing image sha256:d1c5e14d996acf1bc213061ab64832fcb4dc5a530b235649758357df7c7cd9ba                     0.0s
 => => naming to us-central1-docker.pkg.dev/paw-match-1/paw-match/backend:12a9679                                0.0s
linpatr@PAT-PC:/mnt/d/osu/W2026/cs_462/paw-match-app$   docker push us-central1-docker.pkg.dev/paw-match-1/paw-match/backend:$TAG       
The push refers to repository [us-central1-docker.pkg.dev/paw-match-1/paw-match/backend]
ba04e61fc0fa: Layer already exists
077304d19bd3: Layer already exists
a405974115c1: Layer already exists
045c36a747f6: Layer already exists
ce29895978ec: Layer already exists
6e7f71700cfd: Layer already exists
ad8a028fb847: Layer already exists
989e799e6349: Layer already exists
12a9679: digest: sha256:3c2ae74d3f221b49e680d86007a9466b6745393106e714acf8060338e0ee0ab8 size: 1995
linpatr@PAT-PC:/mnt/d/osu/W2026/cs_462/paw-match-app$   gcloud run deploy paw-match-backend --region=us-central1 --image=us-central1-docker.pkg.dev/paw-match-1/paw-match/backend:$TAG
Deploying container to Cloud Run service [paw-match-backend] in project [paw-match-1] region [us-central1]
✓ Deploying... Done.
  ✓ Creating Revision...
  ✓ Routing traffic...
Done.
Service [paw-match-backend] revision [paw-match-backend-00005-m7n] has been deployed and is serving 100 percent of traffic.
Service URL: https://paw-match-backend-314947795490.us-central1.run.app
linpatr@PAT-PC:/mnt/d/osu/W2026/cs_462/paw-match-app$   docker build --build-arg VITE_API_BASE_URL="$BACKEND_URL" -t us-central1-docker.pkg.dev/paw-match-1/paw-match/frontend:$TAG ./frontend
[+] Building 4.7s (15/15) FINISHED                                                                     docker:default
 => [internal] load build definition from Dockerfile                                                             0.1s
 => => transferring dockerfile: 456B                                                                             0.0s
 => [internal] load metadata for docker.io/library/nginx:alpine                                                  0.3s
 => [internal] load metadata for docker.io/library/node:20-alpine                                                0.2s
 => [internal] load .dockerignore                                                                                0.0s
 => => transferring context: 63B                                                                                 0.0s
 => [builder 1/6] FROM docker.io/library/node:20-alpine@sha256:b88333c42c23fbd91596ebd7fd10de239cedab9617de0414  0.0s
 => CACHED [stage-1 1/3] FROM docker.io/library/nginx:alpine@sha256:1d13701a5f9f3fb01aaa88cef2344d65b6b5bf6b7d9  0.0s
 => [internal] load build context                                                                                0.2s
 => => transferring context: 1.71MB                                                                              0.2s
 => CACHED [builder 2/6] WORKDIR /app                                                                            0.0s
 => CACHED [builder 3/6] COPY package*.json ./                                                                   0.0s
 => CACHED [builder 4/6] RUN npm ci                                                                              0.0s
 => [builder 5/6] COPY . .                                                                                       0.1s
 => [builder 6/6] RUN npm run build                                                                              3.3s
 => [stage-1 2/3] COPY --from=builder /app/dist /usr/share/nginx/html                                            0.1s
 => [stage-1 3/3] COPY nginx.conf /etc/nginx/conf.d/default.conf                                                 0.1s
 => exporting to image                                                                                           0.1s
 => => exporting layers                                                                                          0.1s
 => => writing image sha256:7b7115dee7e794290dc1d4caffc305546fdb8d4f16ecac13aa3e41df3491d72f                     0.0s
 => => naming to us-central1-docker.pkg.dev/paw-match-1/paw-match/frontend:12a9679                               0.0s
linpatr@PAT-PC:/mnt/d/osu/W2026/cs_462/paw-match-app$   docker push us-central1-docker.pkg.dev/paw-match-1/paw-match/frontend:$TAG      
The push refers to repository [us-central1-docker.pkg.dev/paw-match-1/paw-match/frontend]
87042a96d537: Pushed
423619f3fbbf: Pushed
da3ac26fdf0f: Layer already exists
7b2903554e63: Layer already exists
6c0e59fd138a: Layer already exists
aa0fc249df10: Layer already exists
f35bcec50d8c: Layer already exists
660f9a93104f: Layer already exists
53998a5033c3: Layer already exists
989e799e6349: Layer already exists
12a9679: digest: sha256:31b56363c6157cb039ebe669375e4fda72d7e31b1cae166c426b94a594bdff71 size: 2407
linpatr@PAT-PC:/mnt/d/osu/W2026/cs_462/paw-match-app$   gcloud run deploy paw-match-frontend --region=us-central1 --image=us-central1-docker.pkg.dev/paw-match-1/paw-match/frontend:$TAG
Deploying container to Cloud Run service [paw-match-frontend] in project [paw-match-1] region [us-central1]
✓ Deploying... Done.
  ✓ Creating Revision...
  ✓ Routing traffic...
Done.
Service [paw-match-frontend] revision [paw-match-frontend-00004-vwc] has been deployed and is serving 100 percent of traffic.
Service URL: https://paw-match-frontend-314947795490.us-central1.run.app
linpatr@PAT-PC:/mnt/d/osu/W2026/cs_462/paw-match-app$
```