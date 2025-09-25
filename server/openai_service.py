import asyncio
import logging
import time
from typing import Dict, Any, List, Optional
import openai
from openai import OpenAI
from server.config import config

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=config.openai.api_key)
        self.config = config.openai
        
    async def process_query(self, query: str, context: Optional[str] = None, schema_data: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Process natural language query using OpenAI"""
        try:
            start_time = time.time()
            
            # Build system message with context
            system_message = self._build_system_message(context, schema_data)
            
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": query}
            ]
            
            logger.info(f"OpenAI request: model={self.config.model}, temperature={self.config.temperature}")
            
            # Make API request with retry logic
            response = await self._make_request_with_retry(messages)
            
            processing_time = time.time() - start_time
            
            # Extract and structure the response
            result = {
                "response": response.choices[0].message.content,
                "model": self.config.model,
                "processing_time": round(processing_time, 3),
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
            logger.info(f"OpenAI response: {result['usage']['total_tokens']} tokens, {processing_time:.3f}s")
            return result
            
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise Exception(f"OpenAI processing failed: {str(e)}")
    
    def _build_system_message(self, context: Optional[str], schema_data: Optional[List[Dict]]) -> str:
        """Build system message with context and schema data"""
        base_message = """You are an AI assistant that helps users find information from structured web data. 
        You have access to Schema.org structured data from various websites.
        
        Your responses should:
        1. Be helpful and accurate based on the provided data
        2. Include relevant Schema.org structured data in your response
        3. Format responses in a clear, conversational manner
        4. When possible, return results in Schema.org JSON-LD format
        5. If no relevant data is found, explain this clearly
        """
        
        if context:
            base_message += f"\n\nContext from previous queries: {context}"
            
        if schema_data:
            base_message += f"\n\nAvailable structured data: {len(schema_data)} relevant items found"
            # Add sample of schema data
            for item in schema_data[:3]:  # Limit to first 3 items
                base_message += f"\n- {item.get('@type', 'Unknown')}: {item.get('name', 'No name')}"
        
        return base_message
    
    async def _make_request_with_retry(self, messages: List[Dict[str, str]]) -> Any:
        """Make OpenAI request with exponential backoff retry"""
        for attempt in range(config.error_handling.retry_attempts):
            try:
                response = self.client.chat.completions.create(
                    model=self.config.model,
                    messages=messages,  # type: ignore
                    temperature=self.config.temperature,
                    max_tokens=self.config.max_tokens,
                    timeout=self.config.timeout
                )
                return response
                
            except openai.RateLimitError as e:
                if attempt < config.error_handling.retry_attempts - 1:
                    wait_time = 2 ** attempt
                    logger.warning(f"Rate limit hit, retrying in {wait_time}s (attempt {attempt + 1})")
                    await asyncio.sleep(wait_time)
                    continue
                raise e
                
            except openai.APIError as e:
                if attempt < config.error_handling.retry_attempts - 1:
                    wait_time = 2 ** attempt
                    logger.warning(f"API error, retrying in {wait_time}s: {str(e)}")
                    await asyncio.sleep(wait_time)
                    continue
                raise e
                
        raise Exception(f"Failed after {config.error_handling.retry_attempts} attempts")
    
    async def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings for text using OpenAI"""
        try:
            response = self.client.embeddings.create(
                model=config.nlweb.embedding_model,
                input=texts
            )
            
            embeddings = [data.embedding for data in response.data]
            logger.info(f"Created embeddings for {len(texts)} texts")
            return embeddings
            
        except Exception as e:
            logger.error(f"Embedding creation error: {str(e)}")
            raise Exception(f"Embedding creation failed: {str(e)}")

openai_service = OpenAIService()
