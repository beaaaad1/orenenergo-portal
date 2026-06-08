from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from typing import List

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    messages: List[ChatMessage] = []

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:

        history = [{"role": m.role, "content": m.content} for m in request.messages]

        if not history and request.message:
            history = [{"role": "user", "content": request.message}]

        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {"role": "system", "content": """
Ты — официальный интеллектуальный помощник портала ПАО Россети Волга (Оренбургэнерго).
ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА:
1. Отвечай СТРОГО на русском языке.
2. Твоя специализация: энергетика, электробезопасность, работа Оренбургэнерго и услуги портала.
3. Если вопрос не по теме — вежливо направь пользователя к разделам портала.
4. Ответы должны быть четкими, короткими (3-5 предложений) и профессиональными.
5. Не используй английские слова в ответах (например, вместо 'hesitate' пиши 'стесняйтесь').
"""},
                *history
            ]
        )
        print("MODEL IS ACTIVE: gpt-4o-mini")
        print("FULL RESPONSE:")
        print(response)

        reply = response.choices[0].message.content
        print(f"Ответ от ИИ: {reply}")
        return {"reply": reply}

    except Exception as e:
        print(f"!!! ОШИБКА БЭКЕНДА: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)