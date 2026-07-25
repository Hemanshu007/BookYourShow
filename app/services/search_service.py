import logging
from app.core.es_config import es

logger = logging.getLogger(__name__)


async def search_movies_and_theatres(query_text: str, limit: int = 10):
    """Search movies and theatres using prefix matching."""
    index_name = "booking_search"

    search_query = {
        "query": {
            "match_phrase_prefix": {"name": {"query": query_text, "max_expansions": 10}}
        },
        "size": limit,
    }

    try:
        response = await es.search(index=index_name, body=search_query)
        results = []
        for hit in response["hits"]["hits"]:
            source = hit["_source"]
            results.append(
                {
                    "name": source["name"],
                    "type": source["type"],
                    "db_id": source["db_id"],
                    "score": hit["_score"],
                }
            )

        return results

    except Exception as e:
        logger.error("Error searching Elasticsearch: %s", e)
        return []
