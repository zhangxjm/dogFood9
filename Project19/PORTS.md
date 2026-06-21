==========================================
  Smart Home Voice Control System
  System Port List
==========================================

Port   | Service Name         | Description
-------|----------------------|-----------------------------------
8080   | Flask Backend API    | Main backend service providing REST API
8001   | ASR Service          | Automatic Speech Recognition service
8002   | NLU Service          | Natural Language Understanding service

==========================================
  Detailed Service Information
==========================================

1. Port 8080 - Flask Backend API
   - Endpoints:
     * GET    /                          - API information
     * GET    /api/health                - Health check
     * CRUD   /api/devices/*             - Device management
     * GET    /api/weather/*             - Weather query
     * CRUD   /api/reminders/*           - Reminder management
     * CRUD   /api/music/*               - Music playback control
     * CRUD   /api/scenes/*              - Scene mode management
     * CRUD   /api/users/*               - User and settings management
     * POST   /api/chat/text             - Text chat / NLU processing
     * POST   /api/chat/voice            - Voice chat / ASR+NLU processing
     * GET    /api/chat/history          - Chat history
     * POST   /api/chat/nlu/parse        - NLU parsing

2. Port 8001 - ASR Service (Speech Recognition)
   - Endpoints:
     * POST   /asr                       - Accept audio file, return recognized text
     * GET    /health                    - Health check

3. Port 8002 - NLU Service (Language Understanding)
   - Endpoints:
     * POST   /nlu                       - Accept text, return intent and entities
     * GET    /health                    - Health check

==========================================
  Database
==========================================

- Type: SQLite
- File: backend/smart_home.db
- Tables:
  * users          - User information
  * user_settings  - User personalized settings
  * devices        - Smart device information
  * scenes         - Scene modes
  * scene_devices  - Scene-device association
  * reminders      - User reminders
  * musics         - Music library
  * conversations  - Chat history (multi-turn dialog)

==========================================
  Docker Services (Optional)
==========================================

If using docker-compose, same ports apply:
- backend:       8080:8080
- asr-service:   8001:8001
- nlu-service:   8002:8002
