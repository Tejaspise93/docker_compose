FROM nginx:alpine

# Remove the default nginx welcome page/config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy our static site
COPY html/ /usr/share/nginx/html/

# Copy our reverse-proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80