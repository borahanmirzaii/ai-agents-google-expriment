"""
Web Search Tool

Provides web search capabilities for agents using various search backends.
"""

import os
import logging
from typing import Dict, List, Any, Optional
import json

import requests

logger = logging.getLogger(__name__)


class WebSearchTool:
    """
    Tool for searching the web and retrieving information.

    Supports:
    - Google Custom Search API (when configured)
    - Fallback to simulated search for development
    """

    def __init__(self, api_key: Optional[str] = None, search_engine_id: Optional[str] = None):
        """
        Initialize the web search tool.

        Args:
            api_key: Google Custom Search API key
            search_engine_id: Google Custom Search Engine ID
        """
        self.api_key = api_key or os.getenv("SEARCH_API_KEY")
        self.search_engine_id = search_engine_id or os.getenv("SEARCH_ENGINE_ID")
        self.base_url = "https://www.googleapis.com/customsearch/v1"

    def search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Search the web for a query.

        Args:
            query: The search query
            num_results: Number of results to return (max 10)

        Returns:
            Dictionary with search results
        """
        logger.info(f"Searching for: {query}")

        if self.api_key and self.search_engine_id:
            return self._google_search(query, num_results)
        else:
            logger.warning("No search API configured, using simulated results")
            return self._simulated_search(query, num_results)

    def _google_search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Perform actual Google Custom Search.

        Args:
            query: Search query
            num_results: Number of results

        Returns:
            Search results
        """
        try:
            params = {
                "key": self.api_key,
                "cx": self.search_engine_id,
                "q": query,
                "num": min(num_results, 10)  # API max is 10
            }

            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            results = []
            for item in data.get("items", []):
                results.append({
                    "title": item.get("title"),
                    "link": item.get("link"),
                    "snippet": item.get("snippet"),
                })

            return {
                "query": query,
                "num_results": len(results),
                "results": results,
                "status": "success"
            }

        except Exception as e:
            logger.error(f"Search failed: {e}")
            return {
                "query": query,
                "error": str(e),
                "status": "failed"
            }

    def _simulated_search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Simulate search results for development/testing.

        Args:
            query: Search query
            num_results: Number of results

        Returns:
            Simulated search results
        """
        results = []
        for i in range(min(num_results, 5)):
            results.append({
                "title": f"Result {i+1} for '{query}'",
                "link": f"https://example.com/result-{i+1}",
                "snippet": f"This is a simulated search result snippet {i+1} related to '{query}'. "
                          f"Contains relevant information about the topic.",
            })

        return {
            "query": query,
            "num_results": len(results),
            "results": results,
            "status": "success",
            "simulated": True
        }

    def get_function_declaration(self) -> Dict[str, Any]:
        """
        Get the function declaration for Vertex AI function calling.

        Returns:
            Function declaration schema
        """
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query"
                },
                "num_results": {
                    "type": "integer",
                    "description": "Number of results to return (1-10)",
                    "default": 5
                }
            },
            "required": ["query"]
        }

    def __call__(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Make the tool callable.

        Args:
            query: Search query
            num_results: Number of results

        Returns:
            Search results
        """
        return self.search(query, num_results)


def create_web_search_tool() -> tuple[str, str, callable, dict]:
    """
    Create a web search tool for agent registration.

    Returns:
        Tuple of (name, description, function, parameters)
    """
    tool = WebSearchTool()

    return (
        "web_search",
        "Search the web for information. Use this when you need to find current information, facts, or data from the internet.",
        tool,
        tool.get_function_declaration()
    )
