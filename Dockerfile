FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npm install -g @openai/codex
COPY server.js agents.js watcher.js trigger.py ./
COPY public ./public
COPY agent-skills ./agent-skills
ENV HOST=0.0.0.0 AGENCY_DATA_DIR=/data
EXPOSE 3000
CMD ["npm", "start"]
