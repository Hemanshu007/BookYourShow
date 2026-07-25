import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import api_router
from app.core.es_config import es, create_index
from app.middlewares import GlobalExceptionHandlerMiddleware, RateLimitingMiddleware

from app.services import search_sync
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application...")
    await create_index()
    logger.info("Elasticsearch index verified.")

    yield

    await es.close()
    logger.info("Elasticsearch connection closed.")


app = FastAPI(lifespan=lifespan, title="Online Ticket Booking System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not settings.ENV == "TESTING":
    app.add_middleware(RateLimitingMiddleware, capacity=10, refill_rate=0.1)
app.add_middleware(GlobalExceptionHandlerMiddleware)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}


app.include_router(api_router)
