FROM node:24-bookworm-slim
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npm install -g @openai/codex@0.167.0-alpha.4.1
COPY server.js agents.js watcher.js trigger.py ./
COPY public ./public
COPY agent-skills ./agent-skills
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
ENV HOST=0.0.0.0 AGENCY_DATA_DIR=/data
EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
